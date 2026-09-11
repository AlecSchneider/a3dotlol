"use client";

import { type ReactNode, useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = requireConvexUrl(process.env.NEXT_PUBLIC_CONVEX_URL);
let browserClient: ConvexReactClient | undefined;

export function getConvexClient() {
  // Route-owned providers can unmount while an action is in flight. Reuse the
  // browser session's client without sharing request state during server render.
  if (typeof window === "undefined") return new ConvexReactClient(convexUrl);
  return (browserClient ??= new ConvexReactClient(convexUrl));
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState(getConvexClient);

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

function requireConvexUrl(value: string | undefined) {
  if (!value) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
  }

  return value;
}
