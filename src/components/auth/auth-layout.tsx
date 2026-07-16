"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import { Leaf } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  linkText?: string;
  linkHref?: string;
}

export function AuthLayout({ children, title, subtitle, linkText, linkHref }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Klover</span>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="font-bold text-3xl text-zinc-900 tracking-tighter sm:text-4xl">{title}</h1>
          <p className="mx-auto max-w-[85%] text-base text-muted-foreground">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-6 shadow-xl shadow-zinc-200/20 ring-1 ring-zinc-900/5 backdrop-blur-xl">
          {children}
        </div>

        {linkText && linkHref && (
          <div className="text-center text-muted-foreground text-sm">
            <Link
              href={linkHref}
              className="font-medium text-emerald-600 decoration-emerald-200 underline-offset-4 transition-colors hover:text-emerald-500 hover:underline"
            >
              {linkText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
