"use client";

import { type ReactNode, useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = requireConvexUrl(process.env.NEXT_PUBLIC_CONVEX_URL);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new ConvexReactClient(convexUrl));

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

function requireConvexUrl(value: string | undefined) {
  if (!value) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
  }

  return value;
}
