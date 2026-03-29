import { Command } from "commander";
import type { EventSource } from "eventsource";
import packageJson from "../package.json";
import { ApiClient } from "./api";
import { observePoll } from "./observe";
import type { VoteStore } from "./store";

const program = new Command()
  .name(packageJson.name)
  .version(packageJson.version, "-v, --version")
  .description(packageJson.description)
  .addHelpText("before", `🔍 ${packageJson.name} v${packageJson.version}\n`)
  .argument(
    "[pollIds...]",
    "Identifiants des votes à surveiller (tous par défaut)"
  )
  .option("-s, --server <url>", "URL du serveur", "https://republique.vote")
  .option("-o, --output <dir>", "Dossier de sauvegarde", "./.republique")
  .option("--no-save", "Ne pas sauvegarder localement")
  .option("--verify-only", "Vérifier la chaîne et quitter")
  .action(async (pollIds: string[], opts) => {
    const { server, output, save, verifyOnly } = opts;

    console.log(`\n🔍 ${packageJson.name} v${packageJson.version}`);
    console.log(`📡 Connexion à ${server}...`);

    const api = new ApiClient(server);

    // If no pollIds provided, fetch all open polls
    let ids = pollIds;
    if (ids.length === 0) {
      const polls = await api.listPolls("open");
      ids = polls.map((p) => p.id);

      if (ids.length === 0) {
        console.log("\n   Aucun vote en cours.");
        process.exit(0);
      }

      console.log(
        `\n📋 ${ids.length} vote${ids.length > 1 ? "s" : ""} en cours\n`
      );
    }

    const connections: EventSource[] = [];
    const stores: VoteStore[] = [];

    for (const pollId of ids) {
      const prefix = ids.length > 1 ? `[${pollId}] ` : "";
      console.log("");

      const { eventSource, store } = await observePoll({
        api,
        pollId,
        output,
        save,
        verifyOnly,
        prefix,
      });

      if (eventSource) {
        connections.push(eventSource);
      }
      if (store) {
        stores.push(store);
      }
    }

    if (verifyOnly) {
      console.log("\n✓ Vérification terminée.");
      process.exit(0);
    }

    if (connections.length > 0) {
      console.log("");
    }

    process.on("SIGINT", () => {
      for (const es of connections) {
        es.close();
      }
      for (const store of stores) {
        console.log(
          `\n💾 ${store.count()} votes sauvegardés dans ${store.getPath()}`
        );
      }
      console.log("\n👋 Arrêt de l'observateur.");
      process.exit(0);
    });
  });

program.parse();
