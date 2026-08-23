export async function recordDiscordDelivery(options: {
  record: () => Promise<unknown>;
  remove: () => Promise<unknown>;
}) {
  try {
    await options.record();
  } catch (error) {
    try {
      await options.remove();
    } catch {
      // Retain the original persistence error. Discord cleanup is best effort.
    }
    throw error;
  }
}
