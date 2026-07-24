import Link from "next/link";

const legalLinks = [
  { href: "/contact", label: "contact" },
  { href: "/support", label: "support" },
  { href: "/privacy", label: "privacy" },
  { href: "/cookies", label: "cookies & storage" },
  { href: "/impressum", label: "impressum" },
];

export function LegalFooter() {
  return (
    <footer className="border-t border-[var(--surface-border)] px-6 py-8 text-xs text-[var(--text-muted)]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>Alec Schneider Solutions</p>
        <nav aria-label="Legal and support" className="flex flex-wrap gap-4">
          {legalLinks.map((link) => (
            <Link
              className="transition hover:text-[var(--text-primary)]"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
