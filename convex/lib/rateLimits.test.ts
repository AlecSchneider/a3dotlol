import { describe, expect, it, vi } from "vitest";

import { passesLayeredRateLimits } from "./rateLimits";

describe("layered rate limits", () => {
  it("does not consume the daily circuit breaker after a burst denial", async () => {
    const daily = vi.fn().mockResolvedValue({ ok: true });

    await expect(
      passesLayeredRateLimits(vi.fn().mockResolvedValue({ ok: false }), daily),
    ).resolves.toBe(false);

    expect(daily).not.toHaveBeenCalled();
  });

  it("checks the daily circuit breaker after an allowed burst", async () => {
    const daily = vi.fn().mockResolvedValue({ ok: false });

    await expect(
      passesLayeredRateLimits(vi.fn().mockResolvedValue({ ok: true }), daily),
    ).resolves.toBe(false);

    expect(daily).toHaveBeenCalledTimes(1);
  });
});
