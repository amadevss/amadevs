import type { Metadata } from "next";
import { Section } from "@/components/ui/kit";
import { ChangePasswordForm } from "@/components/cursos/StudentActions";

export const metadata: Metadata = { title: "Contraseña" };

export default function SeguridadPage() {
  return (
    <Section title="Cambiar contraseña">
      <p className="-mt-2 mb-5 text-sm text-muted">
        Al cambiarla cerramos tu sesión en otros dispositivos. Este se queda abierto.
      </p>
      <ChangePasswordForm />
    </Section>
  );
}
