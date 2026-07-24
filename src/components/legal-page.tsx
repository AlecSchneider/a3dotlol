import Link from "next/link";
import { type ReactNode } from "react";

export function LegalPage({
  children,
  eyebrow,
  intro,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  intro?: ReactNode;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-[var(--page)] px-6 py-12 text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl">
        <Link
          className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          href="/"
        >
          ← Back
        </Link>

        <header className="mt-8">
          <p className="text-sm tracking-[0.3em] text-[var(--text-muted)] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl tracking-tight">{title}</h1>
          {intro ? (
            <div className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-subtle)]">
              {intro}
            </div>
          ) : null}
        </header>

        <div className="legal-copy mt-10">{children}</div>
      </div>
    </main>
  );
}
