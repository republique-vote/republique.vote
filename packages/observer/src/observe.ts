import type { Vote } from "@republique/core";
import { formatDateShort } from "@republique/core";
import { EventSource } from "eventsource";
import type { ApiClient } from "./api";
import { VoteStore } from "./store";
import { verifyVote } from "./verify";

interface ObserveOptions {
  api: ApiClient;
  output: string;
  pollId: string;
  prefix?: string;
  save: boolean;
  verifyOnly: boolean;
}

export async function observePoll({
  api,
  pollId,
  output,
  save,
  verifyOnly,
  prefix = "",
}: ObserveOptions): Promise<{ eventSource?: EventSource; store?: VoteStore }> {
  const poll = await api.getPoll(pollId);
  const optionMap = new Map(poll.options.map((o) => [o.id, o.label]));

  console.log(`${prefix}📋 ${poll.title}`);
  console.log(
    `${prefix}   ${poll.status === "open" ? "En cours" : "Terminé"} · ${poll.voteCount} votes · Fin le ${formatDateShort(poll.endDate)}`
  );

  const store = save ? new VoteStore(output, pollId) : undefined;

  console.log(`${prefix}🔗 Vérification de la chaîne...`);

  let lastHash: string | null = null;
  let totalVerified = 0;
  let chainValid = true;

  for await (const votes of api.getAllVotesPaginated(pollId)) {
    const sorted = [...votes].sort((a, b) => a.sequence - b.sequence);

    for (const vote of sorted) {
      const result = verifyVote(pollId, vote, lastHash);
      if (!result.valid) {
        console.log(`${prefix}   ✗ ${result.error}`);
        chainValid = false;
        break;
      }
      lastHash = vote.hash;
      totalVerified++;
    }

    if (!chainValid) {
      break;
    }

    if (store) {
      store.addVotes(sorted);
    }

    if (totalVerified > 0) {
      process.stdout.write(
        `${prefix}   ✓ ${totalVerified}/${poll.voteCount} votes vérifiés\r`
      );
    }
  }

  if (chainValid) {
    console.log(
      `${prefix}   ✓ ${totalVerified}/${poll.voteCount} votes vérifiés — chaîne intacte`
    );
  } else {
    console.log(`${prefix}   ✗ ANOMALIE DÉTECTÉE — chaîne corrompue !`);
  }

  if (store) {
    console.log(
      `${prefix}💾 Copie: ${store.getPath()} (${store.count()} votes)`
    );
  }

  if (verifyOnly || !chainValid) {
    return { store };
  }

  console.log(`${prefix}📡 Surveillance en temps réel...`);

  const es = new EventSource(api.createSSEUrl(pollId));

  es.onmessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data);

    if (data.type === "vote") {
      const vote: Vote = {
        sequence: data.sequence,
        optionId: data.optionId,
        blindToken: data.blindToken,
        blindSignature: data.blindSignature,
        hash: data.hash,
        previousHash: data.previousHash,
        createdAt: data.createdAt,
      };

      const result = verifyVote(pollId, vote, lastHash);
      const optionLabel = optionMap.get(vote.optionId) || vote.optionId;
      const shortHash = vote.hash.slice(0, 12);

      if (result.valid) {
        console.log(
          `${prefix}   #${vote.sequence} ${optionLabel.padEnd(12)} ${shortHash}…  ✓`
        );
        lastHash = vote.hash;

        if (store) {
          store.addVote(vote);
        }
      } else {
        console.log(
          `${prefix}   #${vote.sequence} ${optionLabel.padEnd(12)} ${shortHash}…  ✗ ANOMALIE`
        );
        console.log(`${prefix}   ${result.error}`);
      }
    }
  };

  es.onerror = () => {
    console.log(`${prefix}📡 Connexion perdue. Reconnexion...`);
  };

  return { eventSource: es, store };
}
