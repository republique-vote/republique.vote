export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

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
