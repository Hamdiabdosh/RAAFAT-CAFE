import type { ReactNode } from "react";

export function CustomerLayout({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="min-h-svh bg-background" style={style}>
      {children}
    </div>
  );
}
