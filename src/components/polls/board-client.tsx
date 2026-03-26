"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyableHash } from "@/components/ui/copyable-hash";
import { VerifyVoteDialog } from "@/components/polls/verify-vote-dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	CheckCircle,
	XCircle,
	HelpCircle,
	ShieldCheck,
	Loader2,
	Copy,
	Check,
	ChevronLeft,
	ChevronRight,
	Search,
	RefreshCw,
} from "lucide-react";

interface Vote {
	sequence: number;
	optionId: string;
	blindToken: string;
	blindSignature: string;
	hash: string;
	previousHash: string | null;
	createdAt: string;
}

interface BoardClientProps {
	poll: {
		id: string;
		title: string;
		status: string;
		merkleRoot: string | null;
	};
	options: { id: string; label: string }[];
	initialVotes: Vote[];
	totalVotes: number;
	serverChainValid: boolean;
}

type VerifyState = "idle" | "fetching" | "verifying" | "valid" | "invalid";

async function computeHashBrowser(
	previousHash: string | null,
	vote: { pollId: string; optionId: string; blindToken: string; blindSignature: string; createdAt: string; sequence: number },
): Promise<string> {
	const data = [
		previousHash || "",
		vote.pollId,
		vote.optionId,
		vote.blindToken,
		vote.blindSignature,
		vote.createdAt,
		vote.sequence.toString(),
	].join("|");

	const encoded = new TextEncoder().encode(data);
	const buffer = await crypto.subtle.digest("SHA-256", encoded);
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

const PAGE_SIZE = 50;

function formatDateShort(dateStr: string) {
	return new Date(dateStr).toLocaleDateString("fr-FR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function HashCell({ value }: { value: string }) {
	const [copied, setCopied] = useState(false);
	const truncated = value.slice(0, 12) + "…";

	const handleCopy = async () => {
		await navigator.clipboard.writeText(value);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
			title={value}
		>
			<span>{truncated}</span>
			{copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
		</button>
	);
}

export function BoardClient({ poll, options, initialVotes, totalVotes, serverChainValid }: BoardClientProps) {
	const [verifyState, setVerifyState] = useState<VerifyState>("idle");
	const [verifiedCount, setVerifiedCount] = useState(0);
	const [voteStatus, setVoteStatus] = useState<Map<number, "valid" | "invalid">>(new Map());

	// Vote verification
	const [verifyVoteOpen, setVerifyVoteOpen] = useState(false);

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [displayedVotes, setDisplayedVotes] = useState<Vote[]>(initialVotes);
	const [loadingPage, setLoadingPage] = useState(false);

	const pageCount = Math.ceil(totalVotes / PAGE_SIZE);
	const optionMap = new Map(options.map((o) => [o.id, o.label]));

	const goToPage = useCallback(async (page: number) => {
		setLoadingPage(true);
		try {
			const res = await fetch(`/api/poll/${poll.id}/board?page=${page}&limit=${PAGE_SIZE}`);
			const { data } = await res.json();
			setDisplayedVotes(data.votes);
			setCurrentPage(page);
		} catch {
			// keep current page on error
		}
		setLoadingPage(false);
	}, [poll.id]);

	const [refreshing, setRefreshing] = useState(false);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		await goToPage(1);
		setRefreshing(false);
	}, [goToPage]);

	const handleVerify = useCallback(async () => {
		setVerifyState("fetching");
		setVerifiedCount(0);

		let allVotes: Vote[];
		try {
			const res = await fetch(`/api/poll/${poll.id}/board?all=true`);
			const { data } = await res.json();
			allVotes = data.votes;
		} catch {
			setVerifyState("invalid");
			return;
		}

		setVerifyState("verifying");
		const statusMap = new Map<number, "valid" | "invalid">();

		const BATCH_SIZE = 50;
		for (let i = 0; i < allVotes.length; i += BATCH_SIZE) {
			const batch = allVotes.slice(i, Math.min(i + BATCH_SIZE, allVotes.length));
			for (const vote of batch) {
				const expectedPreviousHash = vote.sequence === 1 ? null : allVotes[vote.sequence - 2]?.hash ?? null;

				if (vote.previousHash !== expectedPreviousHash) {
					statusMap.set(vote.sequence, "invalid");
					setVoteStatus(new Map(statusMap));
					setVerifiedCount(i + batch.indexOf(vote) + 1);
					setVerifyState("invalid");
					return;
				}

				const computed = await computeHashBrowser(vote.previousHash, {
					pollId: poll.id,
					optionId: vote.optionId,
					blindToken: vote.blindToken,
					blindSignature: vote.blindSignature,
					createdAt: vote.createdAt,
					sequence: vote.sequence,
				});

				if (computed !== vote.hash) {
					statusMap.set(vote.sequence, "invalid");
					setVoteStatus(new Map(statusMap));
					setVerifiedCount(i + batch.indexOf(vote) + 1);
					setVerifyState("invalid");
					return;
				}

				statusMap.set(vote.sequence, "valid");
			}
			setVoteStatus(new Map(statusMap));
			setVerifiedCount(Math.min(i + BATCH_SIZE, allVotes.length));
			await new Promise((r) => setTimeout(r, 0));
		}

		setVerifyState("valid");
	}, [poll.id]);

	const verifyButtonLabel = () => {
		switch (verifyState) {
			case "fetching":
				return <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Chargement des votes...</>;
			case "verifying":
				return <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Vérification... ({verifiedCount}/{totalVotes})</>;
			case "valid":
				return <><ShieldCheck className="h-4 w-4 mr-1.5" /> Revérifier la chaîne</>;
			default:
				return <><ShieldCheck className="h-4 w-4 mr-1.5" /> Vérifier la chaîne</>;
		}
	};

	return (
		<>
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight mb-2">Cahier de vote</h1>
				<p className="text-lg text-muted-foreground mb-4">{poll.title}</p>

				<div className="flex flex-wrap items-center gap-2 mb-4">
					<Badge variant={serverChainValid ? "success" : "destructive"}>
						{serverChainValid ? (
							<><CheckCircle className="h-3 w-3 mr-1" /> Chaîne intacte (serveur)</>
						) : (
							<><XCircle className="h-3 w-3 mr-1" /> Chaîne corrompue (serveur)</>
						)}
					</Badge>
					{verifyState === "valid" && (
						<Badge variant="success">
							<ShieldCheck className="h-3 w-3 mr-1" /> Vérifié par votre navigateur
						</Badge>
					)}
					{verifyState === "invalid" && (
						<Badge variant="destructive">
							<XCircle className="h-3 w-3 mr-1" /> Erreur détectée par votre navigateur
						</Badge>
					)}
					<Badge variant="info">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</Badge>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2 mb-6">
					<Button variant="outline" onClick={handleRefresh} disabled={refreshing || loadingPage}>
						<RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
						Actualiser
					</Button>
					<Button variant="outline" onClick={() => setVerifyVoteOpen(true)}>
						<Search className="h-4 w-4 mr-1.5" />
						Retrouver mon vote
					</Button>
					<Button
						variant="outline"
						onClick={handleVerify}
						disabled={verifyState === "fetching" || verifyState === "verifying" || totalVotes === 0}
					>
						{verifyButtonLabel()}
					</Button>
					<Tooltip>
						<TooltipTrigger asChild>
							<HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
						</TooltipTrigger>
						<TooltipContent className="max-w-xs">
							<p>Votre navigateur télécharge tous les votes puis recalcule chaque empreinte pour vérifier que personne n&apos;a modifié le cahier. Tout se passe sur votre appareil.</p>
						</TooltipContent>
					</Tooltip>
				</div>

				{/* Progress bar */}
				{verifyState === "verifying" && (
					<div className="w-full h-1.5 bg-muted mb-6 overflow-hidden">
						<div
							className="h-full bg-primary transition-all duration-150"
							style={{ width: `${(verifiedCount / totalVotes) * 100}%` }}
						/>
					</div>
				)}

				{/* Merkle root */}
				{poll.merkleRoot && (
					<CopyableHash
						label="Empreinte du cahier (Merkle root)"
						tooltip="Le résultat final de la chaîne de hash. Si un seul vote est modifié, cette empreinte change complètement."
						value={poll.merkleRoot}
					/>
				)}
			</div>

			{/* Vote table */}
			{totalVotes === 0 ? (
				<p className="text-muted-foreground text-center py-12">Aucun vote enregistré pour le moment.</p>
			) : (
				<>
					<div className={`border border-border overflow-x-auto ${loadingPage ? "opacity-50 pointer-events-none" : ""}`}>
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/50">
									<th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-10">#</th>
									<th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Choix</th>
									<th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
										<span className="flex items-center gap-1">
											Empreinte
											<Tooltip>
												<TooltipTrigger asChild>
													<HelpCircle className="h-3 w-3 cursor-help" />
												</TooltipTrigger>
												<TooltipContent className="max-w-xs">
													<p>Code unique calculé à partir du vote et du vote précédent.</p>
												</TooltipContent>
											</Tooltip>
										</span>
									</th>
									<th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
										<span className="flex items-center gap-1">
											Empreinte préc.
											<Tooltip>
												<TooltipTrigger asChild>
													<HelpCircle className="h-3 w-3 cursor-help" />
												</TooltipTrigger>
												<TooltipContent className="max-w-xs">
													<p>L&apos;empreinte du vote d&apos;avant. C&apos;est ce qui crée la chaîne.</p>
												</TooltipContent>
											</Tooltip>
										</span>
									</th>
									<th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
										<span className="flex items-center gap-1">
											Jeton
											<Tooltip>
												<TooltipTrigger asChild>
													<HelpCircle className="h-3 w-3 cursor-help" />
												</TooltipTrigger>
												<TooltipContent className="max-w-xs">
													<p>Code anonyme qui prouve le droit de vote sans révéler l&apos;identité.</p>
												</TooltipContent>
											</Tooltip>
										</span>
									</th>
									<th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Date</th>
									<th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-10">
										<Tooltip>
											<TooltipTrigger asChild>
												<ShieldCheck className="h-3.5 w-3.5 cursor-help mx-auto" />
											</TooltipTrigger>
											<TooltipContent className="max-w-xs">
												<p>Résultat de la vérification par votre navigateur.</p>
											</TooltipContent>
										</Tooltip>
									</th>
								</tr>
							</thead>
							<tbody>
								{displayedVotes.map((vote) => {
									const status = voteStatus.get(vote.sequence);

									return (
										<tr
											key={vote.sequence}
											className={`border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors ${
												status === "invalid" ? "bg-destructive/5" : ""
											}`}
										>
											<td className="px-3 py-2.5 font-bold tabular-nums">{vote.sequence}</td>
											<td className="px-3 py-2.5">
												<Badge variant="outline" className="text-xs">
													{optionMap.get(vote.optionId) || vote.optionId}
												</Badge>
											</td>
											<td className="px-3 py-2.5">
												<HashCell value={vote.hash} />
											</td>
											<td className="px-3 py-2.5">
												{vote.previousHash ? (
													<HashCell value={vote.previousHash} />
												) : (
													<Tooltip>
													<TooltipTrigger asChild>
														<span className="text-xs text-muted-foreground italic cursor-help border-b border-dotted border-muted-foreground">genèse</span>
													</TooltipTrigger>
													<TooltipContent className="max-w-xs">
														<p>Premier vote du cahier. Son empreinte est calculée à partir de son contenu uniquement, sans empreinte précédente. C&apos;est le point de départ de la chaîne.</p>
													</TooltipContent>
												</Tooltip>
												)}
											</td>
											<td className="px-3 py-2.5">
												<HashCell value={vote.blindToken} />
											</td>
											<td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
												{formatDateShort(vote.createdAt)}
											</td>
											<td className="px-3 py-2.5 text-center">
												{status === "valid" && <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />}
												{status === "invalid" && <XCircle className="h-4 w-4 text-destructive mx-auto" />}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					{pageCount > 1 && (
						<div className="flex items-center justify-between mt-4">
							<p className="text-sm text-muted-foreground">
								Page {currentPage} sur {pageCount}
							</p>
							<div className="flex items-center gap-1">
								<Button
									variant="outline"
									size="icon"
									onClick={() => goToPage(currentPage - 1)}
									disabled={currentPage <= 1 || loadingPage}
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									onClick={() => goToPage(currentPage + 1)}
									disabled={currentPage >= pageCount || loadingPage}
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</>
			)}

			<VerifyVoteDialog pollId={poll.id} open={verifyVoteOpen} onOpenChange={setVerifyVoteOpen} />
		</>
	);
}
