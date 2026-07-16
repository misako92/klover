import type { ReactNode } from "react";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="min-h-screen bg-background font-sans">{children}</div>;
}
