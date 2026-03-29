import { env } from "env";
import { Octokit } from "octokit";

interface MerklePublishParams {
  merkleRoot: string;
  pollId: string;
  sequence: number;
}

// Queue: keeps only the latest state per poll
const pending = new Map<string, MerklePublishParams>();

export function queueMerklePublish(params: MerklePublishParams) {
  pending.set(params.pollId, params);
}

async function flush() {
  if (pending.size === 0) {
    return;
  }
  if (!(env.GITHUB_TOKEN && env.GITHUB_MERKLE_REPO)) {
    return;
  }

  const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
  const [owner, repo] = env.GITHUB_MERKLE_REPO.split("/");

  // Snapshot and clear queue
  const entries = [...pending.entries()];
  pending.clear();

  for (const [, params] of entries) {
    try {
      const path = `polls/${params.pollId}/latest.json`;
      const content = JSON.stringify(
        {
          pollId: params.pollId,
          merkleRoot: params.merkleRoot,
          sequence: params.sequence,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      );

      // Get current file SHA (needed for updates)
      let sha: string | undefined;
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
        });
        if ("sha" in data) {
          sha = data.sha;
        }
      } catch {
        // File doesn't exist yet
      }

      const shortHash = params.merkleRoot.slice(0, 12);

      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `🗳️ update ${params.pollId} merkle root #${params.sequence} (${shortHash})`,
        content: Buffer.from(content).toString("base64"),
        committer: {
          name: "republique.vote",
          email: "bot@republique.vote",
        },
        ...(sha ? { sha } : {}),
      });

      console.log(
        `[github] Merkle root published: ${params.pollId} #${params.sequence}`
      );
    } catch (err) {
      console.error(`[github] Flush failed for ${params.pollId}:`, err);
    }
  }
}

// Flush every 30 seconds
setInterval(flush, 30_000);
