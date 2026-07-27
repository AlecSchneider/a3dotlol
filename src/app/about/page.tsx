import Link from "next/link";

import { JsonLd } from "~/components/json-ld";
import { youtubeHref } from "~/lib/links";
import { aboutJsonLd, createPageMetadata } from "~/lib/seo";

export const metadata = createPageMetadata({
  title: "About Alec Schneider and the €100k App Challenge",
  description:
    "Meet Alec Schneider and follow the challenge to build and grow vibe-coded apps live on YouTube toward €100,000 in revenue.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--page)] px-6 py-12 text-[var(--text-primary)]">
      <JsonLd data={aboutJsonLd} />
      <div className="mx-auto max-w-2xl">
        <Link
          className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          href="/"
        >
          ← Back
        </Link>

        <header className="mt-8">
          <p className="text-sm tracking-[0.3em] text-[var(--text-muted)] uppercase">
            The Project
          </p>
          <h1 className="mt-3 text-3xl tracking-tight">Hi, I am Alec</h1>
        </header>

        <section className="mt-10 space-y-6">
          <article className="border border-[var(--surface-border)] bg-[var(--surface)] px-5 py-5">
            <p className="text-sm leading-7 text-[var(--text-subtle)]">
              I&apos;ve worked in tech for the last 10 years, including before
              AI and vibe coding. I started my journey at Uber in San Francisco
              as an intern, then spent the next 6 years at Palantir in New York
              City.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--text-subtle)]">
              Before becoming a full-time vibe coder, I helped a good friend
              start{" "}
              <a
                className="underline decoration-white/25 underline-offset-4 transition hover:text-cyan-300 hover:decoration-cyan-300"
                href="https://outtake.ai"
                target="_blank"
                rel="noreferrer"
              >
                Outtake
              </a>
              , which is doing really well.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--text-subtle)]">
              On this website and on YouTube in my live stream, I am challenging
              myself to make 100.000 Euros from vibe-coded apps. I started with
              the first project of building this website, and now I will build
              more and more projects to start generating revenue.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--text-subtle)]">
              If you understand German and want to follow along on the journey,
              feel free to{" "}
              <Link
                className="underline decoration-white/25 underline-offset-4 transition hover:text-red-300 hover:decoration-red-300"
                href={youtubeHref}
                target="_blank"
                rel="noreferrer"
              >
                subscribe to me on YouTube
              </Link>
              .
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
