"use client";

import { type ReactNode, useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

import { env } from "~/env";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL),
  );

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
