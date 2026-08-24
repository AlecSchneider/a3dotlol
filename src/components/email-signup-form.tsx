"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useMutation } from "convex/react";

import { api } from "../../convex/_generated/api";
import { EMAIL_SIGNUP_CONFIG, getSignupLocale } from "~/lib/email-signup";
import { captureProductEvent } from "~/lib/product-analytics";

type RequestState = {
  message: string | null;
  status: "idle" | "submitting" | "success" | "error";
};

const idleState: RequestState = { message: null, status: "idle" };

export function EmailSignupForm() {
  const [signupState, setSignupState] = useState<RequestState>(idleState);
  const [withdrawalState, setWithdrawalState] =
    useState<RequestState>(idleState);
  const hasOpened = useRef(false);
  const subscribe = useMutation(api.newsletter.subscribe);
  const withdraw = useMutation(api.newsletter.withdraw);

  function handleFormFocus() {
    if (hasOpened.current) {
      return;
    }

    hasOpened.current = true;
    captureProductEvent("email_signup_opened", {
      product_key: EMAIL_SIGNUP_CONFIG.productKey,
    });
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (signupState.status === "submitting") {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = readFormString(formData, "email");
    const productUpdates = formData.get("productUpdates") === "on";
    const publisherPromotions = formData.get("publisherPromotions") === "on";

    if (!productUpdates && !publisherPromotions) {
      setSignupState({
        message: "Choose at least one type of email update.",
        status: "error",
      });
      captureProductEvent("email_signup_failed", {
        failure_stage: "client_validation",
        product_key: EMAIL_SIGNUP_CONFIG.productKey,
      });
      return;
    }

    setSignupState({ message: null, status: "submitting" });
    captureProductEvent("email_signup_submitted", {
      product_key: EMAIL_SIGNUP_CONFIG.productKey,
      product_updates: productUpdates,
      publisher_promotions: publisherPromotions,
    });

    try {
      await subscribe({
        ...EMAIL_SIGNUP_CONFIG,
        email,
        locale: getSignupLocale(),
        productUpdates,
        publisherPromotions,
      });

      form.reset();
      setSignupState({
        message:
          "Your choices were saved. No marketing email will be sent until double opt-in is available.",
        status: "success",
      });
      captureProductEvent("email_signup_succeeded", {
        product_key: EMAIL_SIGNUP_CONFIG.productKey,
        product_updates: productUpdates,
        publisher_promotions: publisherPromotions,
      });
    } catch {
      setSignupState({
        message: "Your choices could not be saved. Please wait and try again.",
        status: "error",
      });
      captureProductEvent("email_signup_failed", {
        failure_stage: "backend",
        product_key: EMAIL_SIGNUP_CONFIG.productKey,
      });
    }
  }

  async function handleWithdrawal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (withdrawalState.status === "submitting") {
      return;
    }

    const form = event.currentTarget;
    const email = readFormString(new FormData(form), "withdrawalEmail");

    setWithdrawalState({ message: null, status: "submitting" });

    try {
      await withdraw({
        ...EMAIL_SIGNUP_CONFIG,
        email,
        locale: getSignupLocale(),
      });

      form.reset();
      setWithdrawalState({
        message:
          "Withdrawal processed. Both email purposes are now disabled if the address was registered.",
        status: "success",
      });
      captureProductEvent("email_signup_withdrawn", {
        product_key: EMAIL_SIGNUP_CONFIG.productKey,
      });
    } catch {
      setWithdrawalState({
        message:
          "Withdrawal could not be processed. Please wait and try again.",
        status: "error",
      });
      captureProductEvent("email_signup_failed", {
        failure_stage: "withdrawal_backend",
        product_key: EMAIL_SIGNUP_CONFIG.productKey,
      });
    }
  }

  const isSubmitting = signupState.status === "submitting";
  const isWithdrawing = withdrawalState.status === "submitting";

  return (
    <section
      aria-labelledby="email-signup-title"
      className="homepage-fade mt-12 border-t border-[var(--surface-border)] pt-8 [animation-delay:540ms]"
      id="email-updates"
    >
      <p className="text-xs font-medium tracking-[0.24em] text-[var(--text-muted)] uppercase">
        Email updates
      </p>
      <h2
        className="mt-3 text-lg text-[var(--text-primary)]"
        id="email-signup-title"
      >
        Choose what you want to hear about
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-subtle)]">
        Both choices are optional, start unchecked, and can be changed or
        withdrawn at any time. The site works the same without signing up.
      </p>

      <form
        className="ph-no-capture mt-6 space-y-5"
        onFocusCapture={handleFormFocus}
        onSubmit={handleSignup}
      >
        <div>
          <label
            className="block text-sm text-[var(--text-primary)]"
            htmlFor="signup-email"
          >
            Email address
          </label>
          <input
            aria-describedby="signup-email-help"
            autoComplete="email"
            className="homepage-input mt-2 w-full"
            disabled={isSubmitting}
            id="signup-email"
            maxLength={254}
            name="email"
            required
            type="email"
          />
          <p
            className="mt-2 text-xs leading-5 text-[var(--text-muted)]"
            id="signup-email-help"
          >
            Stored in Convex only for the choices below. It is not sent to
            analytics or Discord.
          </p>
        </div>

        <fieldset
          aria-describedby="signup-purpose-help signup-purpose-error"
          className="space-y-3"
        >
          <legend className="text-sm text-[var(--text-primary)]">
            Email purposes
          </legend>
          <p
            className="text-xs leading-5 text-[var(--text-muted)]"
            id="signup-purpose-help"
          >
            Select at least one. Each consent is separate. Saving replaces the
            current choices for this address, so an unchecked purpose is
            withdrawn.
          </p>
          <ConsentChoice
            description="News about a3.lol and Alec’s €100k app challenge."
            disabled={isSubmitting}
            id="product-updates"
            label="a3.lol product updates"
            name="productUpdates"
          />
          <ConsentChoice
            description="Launches and promotions for other Alec Schneider Solutions apps."
            disabled={isSubmitting}
            id="publisher-promotions"
            label="Other product announcements"
            name="publisherPromotions"
          />
        </fieldset>

        <p className="text-xs leading-6 text-[var(--text-muted)]">
          By selecting a purpose and submitting, you consent to that specific
          marketing use under Article 6(1)(a) GDPR. Collection is live, but
          email sending is not: records remain unverified until a double-opt-in
          system is added. Read the{" "}
          <Link
            className="text-[var(--text-primary)] underline decoration-white/30 underline-offset-4"
            href="/privacy#email-updates"
          >
            privacy notice
          </Link>
          .
        </p>

        <button
          className="homepage-button"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "saving..." : "save email choices"}
        </button>

        <p
          aria-live="polite"
          className="min-h-6 text-sm text-[var(--text-subtle)]"
          id="signup-purpose-error"
          role="status"
        >
          {signupState.message}
        </p>
      </form>

      <details className="mt-6 border-t border-[var(--surface-border)] pt-5">
        <summary className="cursor-pointer text-sm text-[var(--text-primary)] underline decoration-white/30 underline-offset-4">
          Withdraw both email consents
        </summary>
        <form
          className="ph-no-capture mt-5 space-y-4"
          onSubmit={handleWithdrawal}
        >
          <div>
            <label
              className="block text-sm text-[var(--text-primary)]"
              htmlFor="withdrawal-email"
            >
              Registered email address
            </label>
            <input
              autoComplete="email"
              className="homepage-input mt-2 w-full"
              disabled={isWithdrawing}
              id="withdrawal-email"
              maxLength={254}
              name="withdrawalEmail"
              required
              type="email"
            />
          </div>
          <button
            className="border border-white/20 px-4 py-3 text-sm text-[var(--text-primary)] transition hover:border-white/40 disabled:opacity-70"
            disabled={isWithdrawing}
            type="submit"
          >
            {isWithdrawing ? "withdrawing..." : "withdraw email consent"}
          </button>
          <p
            aria-live="polite"
            className="min-h-6 text-sm text-[var(--text-subtle)]"
            role="status"
          >
            {withdrawalState.message}
          </p>
        </form>
      </details>
    </section>
  );
}

function ConsentChoice({
  description,
  disabled,
  id,
  label,
  name,
}: {
  description: string;
  disabled: boolean;
  id: string;
  label: string;
  name: "productUpdates" | "publisherPromotions";
}) {
  return (
    <label
      className="flex cursor-pointer items-start gap-3 border border-[var(--surface-border)] bg-[var(--surface)] p-4 transition hover:border-white/25"
      htmlFor={id}
    >
      <input
        className="mt-1 size-4 shrink-0 accent-cyan-400"
        disabled={disabled}
        id={id}
        name={name}
        type="checkbox"
      />
      <span>
        <span className="block text-sm text-[var(--text-primary)]">
          {label}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">
          {description}
        </span>
      </span>
    </label>
  );
}

function readFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
