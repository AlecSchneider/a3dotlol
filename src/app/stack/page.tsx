import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "My Vibe Coding Stack ($0) | a3.lol",
  description: "The zero-dollar stack behind a3.lol",
};

const stackItems = [
  {
    name: "Omarchy (Arch Linux)",
    href: "https://omarchy.org",
    description:
      "The OS I use while building the site. Omarchy gives me an Arch Linux setup tuned for shipping quickly.",
    videoHref: "https://www.youtube.com/watch?v=Ts0IdyIYBfo",
    videoThumbnailSrc: "https://i.ytimg.com/vi/Ts0IdyIYBfo/maxresdefault.jpg",
    videoTitle: "How I use Omarchy",
  },
  {
    name: "AI Agents",
    href: "https://openai.com/codex/",
    description:
      "The two options I’d point people to first: Codex as the best paid option, and OpenCode if you want a free setup.",
    agents: [
      {
        name: "Codex (Paid)",
        href: "https://openai.com/codex/",
        description:
          "The best paid coding agent option I’ve used. It is the fastest way I know to go from idea to working code when I want strong reasoning, solid edits, and fewer dead ends.",
      },
      {
        name: "OpenCode (free)",
        href: "https://opencode.ai/",
        description:
          "If you want a free option, I put together a video showing how I use Open Code as a practical setup without paying for a premium coding agent.",
      },
    ],
    videoHref: "https://www.youtube.com/watch?v=1vJKHymwvoc",
    videoThumbnailSrc: "https://i.ytimg.com/vi/1vJKHymwvoc/maxresdefault.jpg",
    videoTitle: "Free coding agent option with Open Code",
  },
  {
    name: "create-t3-app",
    href: "https://create.t3.gg/",
    description:
      "The codebase foundation. It gives the project the Next.js app router structure, TypeScript setup, env validation, Prisma wiring, and tRPC patterns this site uses.",
  },
  {
    name: "Supabase",
    href: "https://supabase.com/",
    description:
      "Hosted Postgres for the newsletter data. Prisma connects to the Supabase database, so the app keeps a clean typed server-side data layer without running its own database.",
  },
  {
    name: "Vercel",
    href: "https://vercel.com/",
    description:
      "Hosting and deployment. It fits this site well because the app is small, static-heavy, and works cleanly with Next.js.",
  },
];

export default function StackPage() {
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
            Stack
          </p>
          <h1 className="mt-3 text-3xl tracking-tight">
            My Vibe Coding Stack ($0)
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-subtle)]">
            This is the current stack behind a3.lol. The goal is simple:
            ship fast, keep the surface area small, and avoid paying for
            infrastructure before the site actually needs it.
          </p>
        </header>

        <section className="mt-10 space-y-6">
          {stackItems.map((item) => (
            <article
              key={item.name}
              className="border border-[var(--surface-border)] bg-[var(--surface)] px-5 py-5"
            >
              <h2 className="text-base text-[var(--text-primary)]">
                <a
                  className="group inline-flex items-center gap-2 underline decoration-white/25 underline-offset-4 transition hover:text-cyan-300 hover:decoration-cyan-300"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{item.name}</span>
                  <span
                    aria-hidden="true"
                    className="text-[var(--text-muted)] opacity-70 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                  >
                    <ArrowIcon />
                  </span>
                </a>
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--text-subtle)]">
                {item.description}
              </p>
              {"agents" in item ? (
                <div className="mt-4 space-y-4 border-t border-[var(--surface-border)] pt-4">
                  {item.agents.map((agent) => (
                    <div key={agent.name}>
                      <h3 className="text-sm text-[var(--text-primary)]">
                        <a
                          className="group inline-flex items-center gap-2 underline decoration-white/25 underline-offset-4 transition hover:text-cyan-300 hover:decoration-cyan-300"
                          href={agent.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>{agent.name}</span>
                          <span
                            aria-hidden="true"
                            className="text-[var(--text-muted)] opacity-70 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                          >
                            <ArrowIcon />
                          </span>
                        </a>
                      </h3>
                      <p className="mt-1 text-sm leading-7 text-[var(--text-subtle)]">
                        {agent.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              {"videoHref" in item ? (
                <a
                  className="group mt-4 block overflow-hidden border border-[var(--surface-border)] bg-black/20 transition hover:border-cyan-300/60"
                  href={item.videoHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    alt={`${item.videoTitle} thumbnail`}
                    className="aspect-video w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                    height={720}
                    loading="lazy"
                    src={item.videoThumbnailSrc}
                    width={1280}
                  />
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-sm text-[var(--text-primary)]">
                      {item.videoTitle}
                    </span>
                    <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-[var(--text-muted)] uppercase transition group-hover:text-cyan-300">
                      Watch
                      <ArrowIcon />
                    </span>
                  </div>
                </a>
              ) : null}
            </article>
          ))}
        </section>
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
