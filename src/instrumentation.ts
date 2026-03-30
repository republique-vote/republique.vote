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

  // Assembly sync: every 6 hours
  const SYNC_INTERVAL = 6 * 60 * 60 * 1000;
  const cronSecret = process.env.CRON_SECRET;
  const baseUrl = process.env.AUTH_BASE_URL || "http://localhost:3000";

  async function syncAssembly() {
    if (!cronSecret) {
      return;
    }
    try {
      const url = `${baseUrl}/api/cron/sync-assembly?secret=${cronSecret}`;
      const res = await fetch(url);
      if (res.ok) {
        const { data } = await res.json();
        console.log(
          `[assembly] Synchro: ${data.newDossiers} nouveaux dossiers, ${data.matchedScrutins} scrutins matchés (${new Date().toISOString()})`
        );
      } else {
        console.error(`[assembly] Sync failed: ${res.status}`);
      }
    } catch (err) {
      console.error("[assembly] Sync failed:", err);
    }
  }

  // Run first sync after 30 seconds (let the server start)
  setTimeout(() => {
    syncAssembly();
    setInterval(syncAssembly, SYNC_INTERVAL);
  }, 30_000);

  console.log("[assembly] Sync scheduled every 6 hours");
}
