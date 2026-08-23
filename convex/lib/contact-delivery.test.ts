import { describe, expect, it, vi } from "vitest";

import { recordDiscordDelivery } from "./contact-delivery";

describe("contact delivery persistence", () => {
  it("removes the Discord message when its retention record cannot be saved", async () => {
    const persistenceError = new Error("retention record failed");
    const remove = vi.fn().mockResolvedValue(undefined);

    await expect(
      recordDiscordDelivery({
        record: vi.fn().mockRejectedValue(persistenceError),
        remove,
      }),
    ).rejects.toBe(persistenceError);

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("keeps a recorded Discord message for scheduled retention cleanup", async () => {
    const remove = vi.fn().mockResolvedValue(undefined);

    await recordDiscordDelivery({
      record: vi.fn().mockResolvedValue(undefined),
      remove,
    });

    expect(remove).not.toHaveBeenCalled();
  });
});
