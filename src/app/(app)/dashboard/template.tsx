"use client";

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full animate-enter">{children}</div>;
}
