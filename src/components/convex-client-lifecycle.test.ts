import type { ConvexReactClient } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sockets: FakeWebSocket[] = [];
const clients = new Set<ConvexReactClient>();
const listeners = new Map<string, Set<unknown>>();

class FakeWebSocket {
  readyState = 0;
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onclose?: (event: { code: number }) => void;

  constructor() {
    sockets.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.();
    });
  }

  send(raw: string) {
    const message = JSON.parse(raw) as { type: string; requestId: number };
    if (message.type === "Action") {
      queueMicrotask(() =>
        this.onmessage?.({
          data: JSON.stringify({
            type: "ActionResponse",
            requestId: message.requestId,
            success: true,
            result: { status: "sent" },
            logLines: [],
          }),
        }),
      );
    }
  }

  close() {
    this.readyState = 3;
    queueMicrotask(() => this.onclose?.({ code: 1000 }));
  }
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://audit.convex.cloud");
  vi.stubGlobal("WebSocket", FakeWebSocket);
  vi.stubGlobal("window", {
    addEventListener(type: string, listener: unknown) {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener(type: string, listener: unknown) {
      listeners.get(type)?.delete(listener);
    },
  });
});

afterEach(async () => {
  await Promise.all([...clients].map((client) => client.close()));
  clients.clear();
  sockets.length = 0;
  listeners.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Convex client factory lifetime", () => {
  it("uses one lazy browser connection across three completed form actions", async () => {
    const { getConvexClient } = await import("./convex-client-provider");
    const first = getConvexClient();
    clients.add(first);
    expect(sockets).toHaveLength(0);
    const counts = [];
    for (let route = 0; route < 3; route++) {
      const client = getConvexClient();
      clients.add(client);
      await client.action(
        makeFunctionReference<"action">("contact:submit"),
        {},
      );
      counts.push(sockets.filter((socket) => socket.readyState === 1).length);
    }
    expect(counts).toEqual([1, 1, 1]);
    expect(clients.size).toBe(1);
    expect(listeners.get("online")?.size).toBe(1);
  });

  it("does not share server-rendered clients between requests", async () => {
    vi.stubGlobal("window", undefined);
    const { getConvexClient } = await import("./convex-client-provider");
    const first = getConvexClient();
    const second = getConvexClient();
    clients.add(first);
    clients.add(second);
    expect(first).not.toBe(second);
    expect(sockets).toHaveLength(0);
  });
});
