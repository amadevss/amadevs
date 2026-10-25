import { AwsClient } from "aws4fetch";

/**
 * Almacenamiento de videos en un servicio compatible con S3 (MinIO en el VPS).
 * El bucket es privado: el navegador sube y reproduce con URLs firmadas que
 * caducan, así los archivos nunca pasan por las funciones de Vercel.
 *
 * Variables de entorno:
 *   MEDIA_S3_ENDPOINT    https://s3.bryanoliveros.com
 *   MEDIA_S3_BUCKET      cursos
 *   MEDIA_S3_ACCESS_KEY  / MEDIA_S3_SECRET_KEY
 *   MEDIA_S3_REGION      (opcional, us-east-1)
 */

type Config = { endpoint: string; bucket: string; client: AwsClient };

let cached: Config | null | undefined;

function config(): Config | null {
  if (cached !== undefined) return cached;
  const endpoint = process.env.MEDIA_S3_ENDPOINT?.replace(/\/+$/, "");
  const bucket = process.env.MEDIA_S3_BUCKET;
  const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY;
  const secretAccessKey = process.env.MEDIA_S3_SECRET_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return (cached = null);
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: process.env.MEDIA_S3_REGION || "us-east-1",
  });
  return (cached = { endpoint, bucket, client });
}

export class MediaNotConfiguredError extends Error {
  constructor() {
    super("El almacenamiento de video aún no está configurado");
  }
}

function mustConfig(): Config {
  const c = config();
  if (!c) throw new MediaNotConfiguredError();
  return c;
}

export const mediaConfigured = () => config() !== null;

/** URL path-style: <endpoint>/<bucket>/<key>, con cada segmento codificado. */
function objectUrl(c: Config, key: string): URL {
  const path = key.split("/").map(encodeURIComponent).join("/");
  return new URL(`${c.endpoint}/${c.bucket}/${path}`);
}

async function presign(key: string, method: "GET" | "PUT", expiresSeconds: number, extra?: Record<string, string>) {
  const c = mustConfig();
  const url = objectUrl(c, key);
  url.searchParams.set("X-Amz-Expires", String(expiresSeconds));
  for (const [k, v] of Object.entries(extra ?? {})) url.searchParams.set(k, v);
  const signed = await c.client.sign(url.toString(), { method, aws: { signQuery: true } });
  return signed.url;
}

/** URL para que el navegador suba el archivo con un PUT (máx. 5 GB). */
export function presignUpload(key: string, expiresSeconds = 6 * 60 * 60): Promise<string> {
  return presign(key, "PUT", expiresSeconds);
}

/** URL temporal para reproducir o descargar un archivo privado. */
export function presignDownload(key: string, expiresSeconds = 4 * 60 * 60): Promise<string> {
  return presign(key, "GET", expiresSeconds);
}

/** Tamaño y tipo de un objeto, o null si no existe. */
export async function headObject(key: string): Promise<{ size: number; contentType: string } | null> {
  const c = mustConfig();
  const res = await c.client.fetch(objectUrl(c, key).toString(), { method: "HEAD" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HEAD ${res.status}`);
  return {
    size: Number(res.headers.get("content-length") ?? 0),
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
  };
}

/** Borra objetos sin romper el flujo si alguno falla. */
export async function deleteMedia(keys: (string | null | undefined)[]): Promise<void> {
  const list = keys.filter((k): k is string => !!k);
  if (list.length === 0) return;
  const c = config();
  if (!c) return;
  await Promise.all(
    list.map(async (key) => {
      try {
        const res = await c.client.fetch(objectUrl(c, key).toString(), { method: "DELETE" });
        if (!res.ok && res.status !== 404) throw new Error(`DELETE ${res.status}`);
      } catch (err) {
        console.error("[media] no se pudo borrar", key, err);
      }
    }),
  );
}
