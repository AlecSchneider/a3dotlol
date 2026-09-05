import { DateTime, Effect, Layer, Result } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ContactFailure,
  DiscordContact,
  discordContactLayer,
  submitContact,
} from "../../convex/lib/contactWorkflow";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const input = { email: "test@example.com", message: "Synthetic test" };

describe("contact workflow failure ownership", () => {
  it.each([false, true])(
    "compensates once without masking persistence failure (cleanup fails: %s)",
    async (cleanupFails) => {
      const send = vi.fn(() => Effect.succeed("message-1"));
      const remove = vi.fn(() =>
        cleanupFails
          ? Effect.fail(new ContactFailure({ reason: "transport" }))
          : Effect.succeed(true),
      );
      const record = vi
        .fn()
        .mockRejectedValue(new Error("private database details"));
      const outcome = await Effect.runPromise(
        submitContact(input, {
          withinRateLimits: async () => true,
          record,
        }).pipe(
          Effect.provide(Layer.succeed(DiscordContact, { send, remove })),
          Effect.result,
        ),
      );
      expect(outcome).toMatchObject({
        _tag: "Failure",
        failure: { reason: "persistence" },
      });
      expect(JSON.stringify(outcome)).not.toContain("private");
      expect(send).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledTimes(1);
      expect(remove).toHaveBeenCalledExactlyOnceWith("message-1");
    },
  );

  it("fails closed before delivery if quota lookup fails", async () => {
    const send = vi.fn(() => Effect.succeed("unused"));
    const record = vi.fn();
    const outcome = await Effect.runPromise(
      submitContact(input, {
        withinRateLimits: () =>
          Promise.reject(new Error("private quota details")),
        record,
      }).pipe(
        Effect.provideService(DiscordContact, {
          send,
          remove: () => Effect.succeed(true),
        }),
        Effect.result,
      ),
    );
    expect(outcome).toMatchObject({ failure: { reason: "quotaUnavailable" } });
    expect(send).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
    expect(JSON.stringify(outcome)).not.toContain("private");
  });
});

describe("scoped Discord HTTP", () => {
  it("rejects an unencodable receipt identifier without exposing it or sending HTTP", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const outcome = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* DiscordContact).remove("\ud800");
      }).pipe(
        Effect.provide(
          discordContactLayer(
            () => "https://discord.com/api/webhooks/test/test",
          ),
        ),
        Effect.result,
      ),
    );
    expect(outcome).toMatchObject({ failure: { reason: "receipt" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  const send = Effect.gen(function* () {
    const discord = yield* DiscordContact;
    return yield* discord.send(
      { ...input, name: "", subject: "" },
      yield* DateTime.now,
    );
  });
  const layer = () =>
    discordContactLayer(() => "https://discord.com/api/webhooks/test/test");

  it.each(["headers", "body"])(
    "aborts an eight-second stalled %s request without retrying",
    async (phase) => {
      vi.useFakeTimers();
      let signal: AbortSignal | undefined;
      let started!: () => void;
      const start = new Promise<void>((resolve) => {
        started = resolve;
      });
      const fetchMock = vi.fn((_url: unknown, options?: RequestInit) => {
        signal = options?.signal ?? undefined;
        started();
        if (phase === "body")
          return Promise.resolve(
            new Response(
              new ReadableStream({
                start(controller) {
                  signal?.addEventListener(
                    "abort",
                    () =>
                      controller.error(new Error("aborted private response")),
                    { once: true },
                  );
                },
              }),
            ),
          );
        return new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener(
            "abort",
            () => reject(new Error("private transport details")),
            { once: true },
          );
        });
      });
      vi.stubGlobal("fetch", fetchMock);
      const result = Effect.runPromise(
        send.pipe(Effect.provide(layer()), Effect.result),
      );
      await start;
      await vi.advanceTimersByTimeAsync(8001);
      const outcome = await result;
      expect(outcome).toMatchObject({ failure: { reason: "transport" } });
      expect(signal?.aborted).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(outcome)).not.toContain("private");
    },
  );

  it("closes the request scope after consuming a successful receipt", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: unknown, options?: RequestInit) => {
        signal = options?.signal ?? undefined;
        return Promise.resolve(
          new Response(JSON.stringify({ id: "message-1" })),
        );
      }),
    );
    expect(await Effect.runPromise(send.pipe(Effect.provide(layer())))).toBe(
      "message-1",
    );
    expect(signal?.aborted).toBe(true);
  });

  it.each([204, 404, 503])(
    "deletes with correct status policy (%s)",
    async (status) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(null, { status }));
      vi.stubGlobal("fetch", fetchMock);
      const outcome = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* (yield* DiscordContact).remove("message/1");
        }).pipe(Effect.provide(layer()), Effect.result),
      );
      expect(Result.isSuccess(outcome) && outcome.success).toBe(status !== 503);
      const [url, options] = fetchMock.mock.calls[0] as unknown as [
        URL,
        RequestInit,
      ];
      expect(new URL(url).pathname).toBe(
        "/api/webhooks/test/test/messages/message%2F1",
      );
      expect(new URL(url).search).toBe("");
      expect(options.method).toBe("DELETE");
    },
  );
});
