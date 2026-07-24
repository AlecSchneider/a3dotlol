"use client";

import Link from "next/link";
import { useState } from "react";
import { useAction } from "convex/react";

import { api } from "../../convex/_generated/api";

type FormState = {
  error: string | null;
  status: "idle" | "submitting" | "success" | "error";
};

const initialState: FormState = {
  error: null,
  status: "idle",
};

export function ContactForm() {
  const [state, setState] = useState<FormState>(initialState);
  const submitContact = useAction(api.contact.submit);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status === "submitting") {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    setState({ error: null, status: "submitting" });

    try {
      await submitContact({
        email: readFormString(formData, "email"),
        message: readFormString(formData, "message"),
        name: readFormString(formData, "name"),
        subject: readFormString(formData, "subject"),
        website: readFormString(formData, "website"),
      });

      form.reset();
      setState({ error: null, status: "success" });
    } catch {
      setState({
        error:
          "The message could not be sent. Please try again or email alec@a3.lol.",
        status: "error",
      });
    }
  }

  const isSubmitting = state.status === "submitting";

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          autoComplete="name"
          disabled={isSubmitting}
          id="contact-name"
          label="Name (optional)"
          maxLength={100}
          name="name"
          type="text"
        />
        <FormField
          autoComplete="email"
          disabled={isSubmitting}
          id="contact-email"
          label="Email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </div>

      <FormField
        autoComplete="off"
        disabled={isSubmitting}
        id="contact-subject"
        label="Subject (optional)"
        maxLength={120}
        name="subject"
        type="text"
      />

      <div>
        <label
          className="block text-sm text-[var(--text-primary)]"
          htmlFor="contact-message"
        >
          Message
        </label>
        <textarea
          className="homepage-input mt-2 min-h-44 w-full resize-y"
          disabled={isSubmitting}
          id="contact-message"
          maxLength={2000}
          name="message"
          required
        />
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Maximum 2,000 characters. Please do not send passwords, payment data,
          health information, or other sensitive data.
        </p>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10000px] h-px w-px overflow-hidden"
      >
        <label htmlFor="contact-website">Website</label>
        <input
          autoComplete="off"
          id="contact-website"
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>

      <p className="text-xs leading-6 text-[var(--text-muted)]">
        Required fields are used to reply to your request. The message is routed
        through Convex to a private Discord channel and automatically deleted
        there after 90 days. Details are in the{" "}
        <Link
          className="underline decoration-white/30 underline-offset-4"
          href="/privacy#contact"
        >
          privacy notice
        </Link>
        .
      </p>

      <button className="homepage-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "sending..." : "send message"}
      </button>

      <p className="min-h-6 text-sm text-[var(--text-subtle)]" role="status">
        {state.status === "success"
          ? "Thanks — your message was sent."
          : state.error}
      </p>
    </form>
  );
}

function readFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function FormField({
  autoComplete,
  disabled,
  id,
  label,
  maxLength,
  name,
  required = false,
  type,
}: {
  autoComplete: string;
  disabled: boolean;
  id: string;
  label: string;
  maxLength: number;
  name: string;
  required?: boolean;
  type: "email" | "text";
}) {
  return (
    <div>
      <label className="block text-sm text-[var(--text-primary)]" htmlFor={id}>
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="homepage-input mt-2 w-full"
        disabled={disabled}
        id={id}
        maxLength={maxLength}
        name={name}
        required={required}
        type={type}
      />
    </div>
  );
}
