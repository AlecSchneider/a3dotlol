"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

type FormState = {
  error: string | null;
  message: string | null;
  status: "idle" | "submitting" | "success" | "error";
};

const initialState: FormState = {
  error: null,
  message: null,
  status: "idle",
};

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>(initialState);
  const subscribe = api.newsletter.subscribe.useMutation();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status === "submitting") {
      return;
    }

    setState({
      error: null,
      message: null,
      status: "submitting",
    });

    try {
      const result = await subscribe.mutateAsync({
        email,
        source: "homepage",
      });

      if (result.status === "duplicate") {
        setEmail("");
        setState({
          error: null,
          message: "You’re already on the list.",
          status: "success",
        });
        return;
      }

      setEmail("");
      setState({
        error: null,
        message: "You’re on the list.",
        status: "success",
      });
    } catch (error) {
      setState({
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        message: null,
        status: "error",
      });
    }
  }

  return (
    <section className="homepage-fade mb-5 [animation-delay:120ms]">
      <p className="text-xs tracking-[0.3em] text-[var(--text-muted)] uppercase">
        Newsletter
      </p>

      <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          className="homepage-input min-w-0 flex-1"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="email@domain.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={state.status === "submitting"}
          required
        />

        <button
          className="homepage-button shrink-0"
          type="submit"
          disabled={state.status === "submitting"}
        >
          {state.status === "submitting" ? "joining..." : "join"}
        </button>
      </form>

      <p
        className="mt-3 min-h-5 text-xs text-[var(--text-muted)]"
        aria-live="polite"
      >
        {state.error ?? state.message}
      </p>
    </section>
  );
}
