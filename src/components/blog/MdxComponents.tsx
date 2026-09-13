import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";

type CodeProps = ComponentPropsWithoutRef<"code"> & { children?: ReactNode };

function isCodeElement(node: ReactNode): node is ReactElement<CodeProps> {
  return !!node && typeof node === "object" && "props" in node;
}

function diffKind(line: string): "add" | "remove" | "context" {
  if (line.startsWith("+") && !line.startsWith("+++")) return "add";
  if (line.startsWith("-") && !line.startsWith("---")) return "remove";
  return "context";
}

function Pre(props: ComponentPropsWithoutRef<"pre">) {
  const { children, ...rest } = props;
  const code = isCodeElement(children) ? children : null;
  const className = code?.props.className ?? "";
  const isDiff = /language-diff\b/.test(className);

  if (!isDiff) return <pre {...rest}>{children}</pre>;

  const raw = String(code?.props.children ?? "").replace(/\n$/, "");
  const lines = raw.split("\n");

  return (
    <pre {...rest}>
      <code className={className}>
        {lines.map((line, i) => (
          <span key={i} className={`diff-line diff-line-${diffKind(line)}`}>
            {line}
            {i < lines.length - 1 ? "\n" : ""}
          </span>
        ))}
      </code>
    </pre>
  );
}

function Table(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="md-table-wrap">
      <table {...props} />
    </div>
  );
}

export const mdxComponents = {
  pre: Pre,
  table: Table,
};
