import Link from "next/link";

import { NewsletterSignup } from "~/components/newsletter-signup";

const links = [
  {
    href: "https://discord.gg/zhxTK8wg",
    label: "discord",
    external: true,
  },
  {
    href: "https://github.com/alecschneider",
    label: "github",
    external: true,
  },
  {
    href: "https://x.com/alechacks",
    label: "x",
    external: true,
  },
  {
    href: "https://www.instagram.com/alecschneider.dev/",
    label: "instagram",
    external: true,
  },
  {
    href: "https://www.tiktok.com/@alecschneider.dev",
    label: "tiktok",
    external: true,
  },
  {
    href: "https://www.linkedin.com/in/alecschneider",
    label: "linkedin",
    external: true,
  },
  {
    href: "mailto:alec@a3.lol",
    label: "email",
    external: false,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--page)] text-[var(--text-primary)]">
      <div className="relative flex min-h-screen flex-col">
        <div className="relative flex flex-1 items-center justify-center px-6 py-16">
          <div className="homepage-glow" />

          <div className="relative z-10 w-full max-w-xs">
            <header className="homepage-fade mb-16 [animation-delay:0ms]">
              <h1 className="text-xl tracking-tight text-[var(--text-primary)]">
                alec
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                vibe coding apps
              </p>
            </header>

            <NewsletterSignup />

            <nav className="flex flex-col">
              {links.map((link, index) => (
                <Link
                  key={link.label}
                  className="homepage-link group homepage-fade relative flex items-center justify-between py-3"
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                  style={{ animationDelay: `${(index + 1) * 60}ms` }}
                >
                  <span className="text-[var(--text-subtle)] transition-colors duration-200 group-hover:text-[var(--text-primary)]">
                    {link.label}
                  </span>
                  <span className="text-[var(--text-muted)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">
                    <ArrowIcon />
                  </span>
                  <span className="absolute right-0 bottom-2 left-0 h-px origin-left scale-x-0 bg-[var(--accent-line)] transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <footer className="homepage-fade px-6 pb-6 [animation-delay:480ms]">
          <div className="mx-auto w-full max-w-xs">
            <Link
              className="text-xs text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
              href="/privacy"
            >
              privacy policy
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M11 3a1 1 0 1 0 0 2h2.586L7.293 11.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5Z" />
      <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z" />
    </svg>
  );
}
