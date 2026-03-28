import { execSync } from "node:child_process";

export function checkPort(port: number, name: string): void {
  try {
    const pid = execSync(`lsof -ti :${port} 2>/dev/null`, { encoding: "utf-8" })
      .trim()
      .split("\n")[0];
    if (pid) {
      console.log("");
      console.log(`⨯ Port ${port} is already in use by process ${pid}.`);
      console.log(`  Another ${name} server may already be running.`);
      console.log("");
      console.log(`  Run \x1b[1mkill ${pid}\x1b[0m to stop it.`);
      console.log("");
      process.exit(1);
    }
  } catch {
    // lsof not found or no process — port is free
  }
}
