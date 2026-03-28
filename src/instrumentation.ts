export function onRequestInit() {
  // Only run in production
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  if (process.env.__CRON_REGISTERED === "1") {
    return;
  }
  process.env.__CRON_REGISTERED = "1";

  const INTERVAL = 10 * 60 * 1000; // 10 minutes

  async function run() {
    try {
      const { resetAndSeed } = await import("@/services/reset");
      await resetAndSeed();
    } catch (err) {
      console.error("[cron] Reset failed:", err);
    }
  }

  // Align to next clock-aligned 10-minute mark (:00, :10, :20, :30, :40, :50)
  const now = Date.now();
  const msIntoInterval = now % INTERVAL;
  const delay = INTERVAL - msIntoInterval;

  setTimeout(() => {
    run();
    setInterval(run, INTERVAL);
  }, delay);

  const nextReset = new Date(now + delay);
  console.log(
    `[cron] Reset scheduled every 10 minutes (next: ${nextReset.toISOString()})`
  );
}
