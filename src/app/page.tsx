import Link from "next/link";

import { ConvexClientProvider } from "~/components/convex-client-provider";
import { EmailSignupForm } from "~/components/email-signup-form";
import { JsonLd } from "~/components/json-ld";
import { links, youtubeHref } from "~/lib/links";
import { homeJsonLd } from "~/lib/seo";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--page)] text-[var(--text-primary)]">
      <JsonLd data={homeJsonLd} />
      <div className="relative flex min-h-screen flex-col">
        <div className="relative flex flex-1 items-center justify-center px-6 py-16">
          <div className="homepage-glow" />

          <div className="relative z-10 w-full max-w-md">
            <header className="homepage-fade mb-16 [animation-delay:0ms]">
              <h1 className="text-xl tracking-tight text-[var(--text-primary)]">
                alec
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                vibe coding apps{" "}
                <Link
                  className="text-[var(--text-primary)] transition hover:text-red-300"
                  data-analytics-cta="youtube_live"
                  data-analytics-placement="hero"
                  href={youtubeHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  LIVE ON YOUTUBE
                </Link>
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--text-primary)] transition hover:text-cyan-300"
                data-analytics-cta="challenge_details"
                data-analytics-placement="hero"
                href="/about"
              >
                <span>The €100k app challenge</span>
                <span aria-hidden="true" className="text-[var(--text-muted)]">
                  ↗
                </span>
              </Link>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  className="inline-flex items-center gap-2 text-sm text-[var(--text-subtle)] transition hover:text-cyan-300"
                  href="/"
                >
                  <span>$0</span>
                  <span aria-hidden="true" className="text-[var(--text-muted)]">
                    |
                  </span>
                  <span>a3.lol (This website)</span>
                  <span aria-hidden="true" className="text-[var(--text-muted)]">
                    ↗
                  </span>
                </Link>
                <Link
                  className="inline-flex items-center gap-2 text-sm text-[var(--text-subtle)] transition hover:text-cyan-300"
                  href="https://whoami.games"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>$0</span>
                  <span aria-hidden="true" className="text-[var(--text-muted)]">
                    |
                  </span>
                  <span>whoami.games</span>
                  <span aria-hidden="true" className="text-[var(--text-muted)]">
                    ↗
                  </span>
                </Link>
              </div>
            </header>

            <div className="homepage-fade mb-6 [animation-delay:180ms]">
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium tracking-[0.24em] text-[var(--text-muted)] uppercase">
                  Blog
                </p>
                <Link
                  className="inline-flex items-center gap-2 text-sm text-[var(--text-primary)] transition hover:text-cyan-300"
                  href="/stack"
                >
                  <span>My Vibe Coding Stack</span>
                  <span aria-hidden="true" className="text-[var(--text-muted)]">
                    ↗
                  </span>
                </Link>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs font-medium tracking-[0.24em] text-[var(--text-muted)] uppercase">
                Links
              </p>
            </div>

            <nav className="flex flex-col">
              {links.map((link, index) => (
                <Link
                  key={link.label}
                  className="homepage-link group homepage-fade relative flex items-center justify-between py-3"
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                  style={{ animationDelay: `${(index + 4) * 60}ms` }}
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

            <ConvexClientProvider>
              <EmailSignupForm />
            </ConvexClientProvider>
          </div>
        </div>
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
