import RateLimit from "@/models/rateLimit";

export async function checkRateLimit(
  ip: string,
  route: string,
  maxAttempts: number,
  windowMs: number,
): Promise<boolean> {
  const now = new Date();

  const record = await RateLimit.findOneAndUpdate(
    { ip, route },
    {
      $setOnInsert: { expiresAt: new Date(now.getTime() + windowMs) },
      $inc: { attempts: 1 },
    },
    { upsert: true, new: true },
  );

  if (record.attempts > maxAttempts) {
    return false;
  }

  return true;
}
