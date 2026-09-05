import { Context, DateTime, Effect, Layer, Schema } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

export class ContactFailure extends Schema.TaggedError<ContactFailure>()(
  "ContactFailure",
  {
    reason: Schema.Literals([
      "email",
      "fields",
      "message",
      "quota",
      "quotaUnavailable",
      "configuration",
      "unavailable",
      "transport",
      "receipt",
      "persistence",
    ]),
  },
) {}

export type ContactInput = {
  email: string;
  message: string;
  name?: string;
  subject?: string;
  website?: string;
};
type NormalizedContact = {
  email: string;
  message: string;
  name: string;
  subject: string;
};
const decodeEmail = Schema.decodeUnknownEffect(
  Schema.String.check(
    Schema.isMinLength(1),
    Schema.isMaxLength(254),
    Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  ),
);
const decodeFields = Schema.decodeUnknownEffect(
  Schema.Struct({
    name: Schema.String.check(Schema.isMaxLength(100)),
    subject: Schema.String.check(Schema.isMaxLength(120)),
  }),
);
const decodeMessage = Schema.decodeUnknownEffect(
  Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(2000)),
);
const receiptSchema = Schema.Struct({
  id: Schema.String.check(Schema.isMinLength(1)),
});

export class DiscordContact extends Context.Service<
  DiscordContact,
  {
    send(
      input: NormalizedContact,
      sentAt: DateTime.Utc,
    ): Effect.Effect<string, ContactFailure>;
    remove(messageId: string): Effect.Effect<boolean, ContactFailure>;
  }
>()("a3dotlol/contact/DiscordContact") {}

// Request-local acquisition only; no global runtime, background fibers or retries.
export const discordContactLayer = (getWebhookUrl: () => string) =>
  Layer.effect(
    DiscordContact,
    Effect.gen(function* () {
      const client = HttpClient.withScope(yield* HttpClient.HttpClient);
      const webhook = Effect.try({
        try: getWebhookUrl,
        catch: () => new ContactFailure({ reason: "configuration" }),
      });
      const send = Effect.fn("DiscordContact.send")(
        function* (input: NormalizedContact, sentAt: DateTime.Utc) {
          const url = new URL(yield* webhook);
          url.searchParams.set("wait", "true");
          const response = yield* client
            .execute(
              HttpClientRequest.post(url).pipe(
                HttpClientRequest.bodyJsonUnsafe({
                  allowed_mentions: { parse: [] },
                  embeds: [
                    {
                      color: 0x22d3ee,
                      description: input.message,
                      fields: [
                        {
                          inline: true,
                          name: "Reply email",
                          value: input.email,
                        },
                        {
                          inline: true,
                          name: "Name",
                          value: input.name || "Not provided",
                        },
                        {
                          inline: false,
                          name: "Subject",
                          value: input.subject || "General contact",
                        },
                      ],
                      footer: {
                        text: "a3.lol contact form · automatic deletion after 90 days",
                      },
                      timestamp: DateTime.formatIso(sentAt),
                      title: "New a3.lol contact request",
                    },
                  ],
                }),
              ),
            )
            .pipe(
              Effect.mapError(
                () => new ContactFailure({ reason: "transport" }),
              ),
            );
          if (response.status < 200 || response.status >= 300)
            return yield* new ContactFailure({ reason: "unavailable" });
          const receipt = yield* HttpClientResponse.schemaBodyJson(
            receiptSchema,
          )(response).pipe(
            Effect.mapError(() => new ContactFailure({ reason: "receipt" })),
          );
          return receipt.id;
        },
        Effect.scoped,
        Effect.timeoutOrElse({
          duration: 8000,
          orElse: () => new ContactFailure({ reason: "transport" }),
        }),
      );

      const remove = Effect.fn("DiscordContact.remove")(
        function* (messageId: string) {
          const webhookUrl = yield* webhook;
          const url = yield* Effect.try({
            try: () => {
              const url = new URL(webhookUrl);
              url.search = "";
              url.pathname = `${url.pathname.replace(/\/$/, "")}/messages/${encodeURIComponent(messageId)}`;
              return url;
            },
            catch: () => new ContactFailure({ reason: "receipt" }),
          });
          const response = yield* client
            .del(url)
            .pipe(
              Effect.mapError(
                () => new ContactFailure({ reason: "transport" }),
              ),
            );
          return (
            (response.status >= 200 && response.status < 300) ||
            response.status === 404
          );
        },
        Effect.scoped,
        Effect.timeoutOrElse({
          duration: 8000,
          orElse: () => new ContactFailure({ reason: "transport" }),
        }),
      );
      return DiscordContact.of({ send, remove });
    }),
  ).pipe(
    Layer.provide(FetchHttpClient.layer),
    Layer.provide(Layer.succeed(FetchHttpClient.Fetch, globalThis.fetch)),
  );

export const submitContact = Effect.fn("submitContact")(function* (
  args: ContactInput,
  dependencies: {
    withinRateLimits(email: string): Promise<boolean>;
    record(messageId: string, deleteAfter: number): Promise<unknown>;
  },
) {
  if ((args.website ?? "").trim() !== "") return { status: "sent" as const };
  // Preserve normalization order and the original error precedence.
  const email = yield* decodeEmail(args.email.trim().toLowerCase()).pipe(
    Effect.mapError(() => new ContactFailure({ reason: "email" })),
  );
  const fields = yield* decodeFields({
    name: args.name?.trim() ?? "",
    subject: args.subject?.trim() ?? "",
  }).pipe(Effect.mapError(() => new ContactFailure({ reason: "fields" })));
  const message = yield* decodeMessage(args.message.trim()).pipe(
    Effect.mapError(() => new ContactFailure({ reason: "message" })),
  );
  const allowed = yield* Effect.tryPromise({
    try: () => dependencies.withinRateLimits(email),
    catch: () => new ContactFailure({ reason: "quotaUnavailable" }),
  });
  if (!allowed) return yield* new ContactFailure({ reason: "quota" });
  const discord = yield* DiscordContact;
  const sentAt = yield* DateTime.now;
  const messageId = yield* discord.send({ email, message, ...fields }, sentAt);
  yield* Effect.tryPromise({
    try: () =>
      dependencies.record(
        messageId,
        DateTime.toEpochMillis(sentAt) + 90 * 86400000,
      ),
    catch: () => new ContactFailure({ reason: "persistence" }),
  }).pipe(
    Effect.catch((error) =>
      discord.remove(messageId).pipe(
        // Cleanup is best effort; do not retry delivery or mask the recording failure.
        Effect.catch(() => Effect.succeed(false)),
        Effect.andThen(Effect.fail(error)),
      ),
    ),
  );
  return { status: "sent" as const };
});
