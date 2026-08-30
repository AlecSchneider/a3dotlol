type LimitResult = { ok: boolean };

export async function passesLayeredRateLimits(
  checkBurst: () => Promise<LimitResult>,
  checkDaily: () => Promise<LimitResult>,
) {
  const burst = await checkBurst();

  if (!burst.ok) {
    return false;
  }

  return (await checkDaily()).ok;
}
