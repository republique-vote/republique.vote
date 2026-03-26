"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "@/services/auth/client";
import {
	generateToken,
	blindToken,
	finalizeSignature,
	toBase64,
} from "@/services/blind-signature/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { CopyableHash } from "@/components/ui/copyable-hash";
import { VerifyVoteDialog } from "@/components/polls/verify-vote-dialog";
import { CheckCircle, AlertTriangle, Info, XCircle, Search, ArrowLeft, Download, Loader2 } from "lucide-react";

interface Option {
	id: string;
	label: string;
	position: number;
}

interface ResultData {
	optionId: string;
	label: string;
	count: number;
	percentage: number;
}

interface ResultsResponse {
	pollId: string;
	totalVotes: number;
	results: ResultData[];
}

type VoteState = "idle" | "voting" | "success" | "error";
type VoteStep = "generate" | "sign" | "submit" | "done";

const VOTE_STEPS: { key: VoteStep; label: string }[] = [
	{ key: "generate", label: "Génération du code secret" },
	{ key: "sign", label: "Signature aveugle" },
	{ key: "submit", label: "Enregistrement du vote" },
	{ key: "done", label: "Vote enregistré" },
];

function formatCountdown(diff: number) {
	if (diff <= 0) return null;
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((diff % (1000 * 60)) / 1000);
	const parts: string[] = [];
	if (days > 0) parts.push(`${days}j`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}min`);
	parts.push(`${seconds}s`);
	return parts.join(" ");
}

function useCountdown(endDateStr: string | null) {
	const [remaining, setRemaining] = useState<string | null>(null);
	useEffect(() => {
		if (!endDateStr) return;
		const update = () => {
			const diff = new Date(endDateStr).getTime() - Date.now();
			setRemaining(formatCountdown(diff));
		};
		update();
		const interval = setInterval(update, 1000);
		return () => clearInterval(interval);
	}, [endDateStr]);
	return remaining;
}

function useRealtimeResults(pollId: string, initialResults: ResultsResponse | null) {
	const [data, setData] = useState<ResultsResponse | null>(initialResults);
	useEffect(() => {
		const eventSource = new EventSource(`/api/poll/${pollId}/results/stream`);
		eventSource.onmessage = (event) => setData(JSON.parse(event.data));
		eventSource.onerror = () => eventSource.close();
		return () => eventSource.close();
	}, [pollId]);
	return data;
}

function formatDate(dateStr: string) {
	return new Date(dateStr).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export interface PollDetailProps {
	poll: {
		id: string;
		title: string;
		description: string;
		type: string;
		status: string;
		startDate: string;
		endDate: string;
	};
	options: Option[];
	initialResults: ResultsResponse | null;
	initialHasVoted: boolean;
	initialVoteCount: number;
}

export function PollDetailClient({
	poll,
	options,
	initialResults,
	initialHasVoted,
	initialVoteCount,
}: PollDetailProps) {
	const { data: session } = useSession();
	const sseResults = useRealtimeResults(poll.id, initialResults);
	const countdown = useCountdown(poll.endDate);

	const [selectedOption, setSelectedOption] = useState<string>("");
	const [voteState, setVoteState] = useState<VoteState>("idle");
	const [voteStep, setVoteStep] = useState<VoteStep>("generate");
	const [errorMessage, setErrorMessage] = useState("");
	const [hasVoted, setHasVoted] = useState(initialHasVoted);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [voteToken, setVoteToken] = useState<string>("");
	const [voteProof, setVoteProof] = useState<{ sequence: number; hash: string; createdAt: string } | null>(null);
	const [verifyOpen, setVerifyOpen] = useState(false);

	const isOpen = poll.status === "open";
	const isAuthenticated = !!session;
	const canVote = isOpen && isAuthenticated && !hasVoted && voteState !== "success";

	const results = sseResults?.results || [];
	const totalVotes = sseResults?.totalVotes || initialVoteCount;

	const handleVote = useCallback(async () => {
		if (!selectedOption) return;
		setVoteState("voting");
		setVoteStep("generate");
		setErrorMessage("");

		try {
			// Step 1: Generate token & blind it
			const pkRes = await fetch(`/api/poll/${poll.id}/public-key`);
			const { data: pkData } = await pkRes.json();
			const token = generateToken();
			const { blindedMsg, inv } = await blindToken(token, pkData.publicKey);

			// Step 2: Get blind signature
			setVoteStep("sign");
			const signRes = await fetch(`/api/poll/${poll.id}/blind-sign`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ blindedToken: toBase64(blindedMsg) }),
			});
			if (!signRes.ok) {
				const err = await signRes.json();
				throw new Error(err.message || "blind_sign_failed");
			}

			const { data: signData } = await signRes.json();
			const blindSig = Uint8Array.from(atob(signData.blindSignature), (c) => c.charCodeAt(0));
			const signature = await finalizeSignature(pkData.publicKey, token, blindSig, inv);

			// Step 3: Submit vote
			setVoteStep("submit");
			const voteRes = await fetch(`/api/poll/${poll.id}/vote`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "omit",
				body: JSON.stringify({
					optionId: selectedOption,
					token: toBase64(token),
					signature: toBase64(signature),
				}),
			});
			if (!voteRes.ok) {
				const err = await voteRes.json();
				throw new Error(err.message || "vote_failed");
			}

			// Step 4: Done
			setVoteStep("done");
			const tokenBase64 = toBase64(token);
			const { data: voteData } = await voteRes.json();
			setVoteToken(tokenBase64);
			if (voteData.sequence && voteData.hash && voteData.createdAt) {
				setVoteProof({ sequence: voteData.sequence, hash: voteData.hash, createdAt: voteData.createdAt });
			}

			// Brief pause to show "done" step before transitioning
			await new Promise((r) => setTimeout(r, 800));
			setVoteState("success");
			setHasVoted(true);
		} catch (err) {
			setVoteState("error");
			setErrorMessage(err instanceof Error ? err.message : "Une erreur est survenue");
		}
	}, [selectedOption, poll.id]);


	return (
		<>
			<p className="text-sm text-muted-foreground mb-6">
				{totalVotes} vote{totalVotes !== 1 ? "s" : ""} enregistré
				{totalVotes !== 1 ? "s" : ""}
				{" · "}
				{isOpen ? (
					<>
						Jusqu&apos;au {formatDate(poll.endDate)} · {countdown || "Vote terminé"}
					</>
				) : (
					<>
						Du {formatDate(poll.startDate)} au {formatDate(poll.endDate)}
					</>
				)}
			</p>

			{voteState === "success" && (
				<div className="mb-6">
					<Alert variant="success" className="mb-3">
						<CheckCircle className="h-4 w-4" />
						<AlertTitle>Vote enregistré</AlertTitle>
						<AlertDescription>Votre vote a été enregistré de manière anonyme et vérifiable.</AlertDescription>
					</Alert>
					<div className="flex flex-wrap gap-2">
						<Button variant="outline" onClick={() => setConfirmOpen(true)}>
							<Download className="h-4 w-4 mr-1.5" />
							Ma preuve de vote
						</Button>
						<Button variant="outline" onClick={() => setVerifyOpen(true)}>
							<Search className="h-4 w-4 mr-1.5" />
							Vérifier mon vote
						</Button>
						<Button variant="outline" asChild>
							<Link href="/polls"><ArrowLeft className="h-4 w-4 mr-1.5" />Voir les autres votes</Link>
						</Button>
					</div>
				</div>
			)}

			{voteState === "error" && (
				<Alert variant="destructive" className="mb-6">
					<XCircle className="h-4 w-4" />
					<AlertTitle>Erreur</AlertTitle>
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			)}

			{isAuthenticated && hasVoted && voteState !== "success" && (
				<div className="mb-6">
					<Alert variant="info" className="mb-3">
						<Info className="h-4 w-4" />
						<AlertTitle>Vous avez déjà voté</AlertTitle>
						<AlertDescription>Vous avez déjà participé à ce vote.</AlertDescription>
					</Alert>
					<div className="flex gap-2">
						<Button variant="outline" asChild>
							<Link href="/polls"><ArrowLeft className="h-4 w-4 mr-1.5" />Voir les autres votes</Link>
						</Button>
						<Button variant="outline" onClick={() => setVerifyOpen(true)}>
							<Search className="h-4 w-4 mr-1.5" />
							Vérifier mon vote
						</Button>
					</div>
				</div>
			)}

			<VerifyVoteDialog pollId={poll.id} open={verifyOpen} onOpenChange={setVerifyOpen} initialToken={voteToken} />

			{isOpen && !isAuthenticated && (
				<div className="mb-6">
					<Alert variant="warning" className="mb-3">
						<AlertTriangle className="h-4 w-4" />
						<AlertTitle>Connexion requise</AlertTitle>
						<AlertDescription>Vous devez vous identifier via FranceConnect pour voter.</AlertDescription>
					</Alert>
					<Button asChild>
						<Link href="/login">Se connecter</Link>
					</Button>
				</div>
			)}

			<div className="mb-6">
				{canVote && (
					<p className="text-sm text-muted-foreground mb-3">
						Sélectionnez une option pour voter
					</p>
				)}
				<div className="flex flex-col gap-3">
					{options.map((opt) => {
						const result = results.find((r) => r.optionId === opt.id);
						const percentage = result?.percentage || 0;
						const count = result?.count || 0;
						const isSelected = selectedOption === opt.id;

						return (
							<button
								key={opt.id}
								type="button"
								disabled={!canVote}
								onClick={() => canVote && setSelectedOption(opt.id)}
								className={`relative overflow-hidden p-4 rounded-lg border text-left transition-colors ${
									isSelected
										? "border-primary border-2"
										: "border-border"
								} ${canVote ? "cursor-pointer hover:border-primary/50" : "cursor-default"}`}
							>
								<div
									className={`absolute top-0 left-0 h-full transition-all duration-300 ${
										isSelected ? "bg-primary/10" : "bg-muted"
									}`}
									style={{ width: `${percentage}%` }}
								/>
								<div className="relative flex justify-between items-center">
									<div className="flex items-center gap-3">
										{canVote && (
											<div
												className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
													isSelected
														? "border-primary border-[6px]"
														: "border-muted-foreground"
												}`}
											/>
										)}
										<span className="font-semibold">{opt.label}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xl font-bold">{percentage}%</span>
										<span className="text-sm text-muted-foreground">
											({count} vote{count !== 1 ? "s" : ""})
										</span>
									</div>
								</div>
							</button>
						);
					})}
				</div>

				{canVote && (
					<>
						<Button
							className="mt-3"
							onClick={() => setConfirmOpen(true)}
							disabled={!selectedOption || voteState === "voting"}
						>
							Voter
						</Button>
						</>
				)}
			</div>

			{/* Vote dialog (confirmation → stepper → success) */}
			<Dialog open={confirmOpen} onOpenChange={(open) => { if (voteState !== "voting") setConfirmOpen(open); }}>
				<DialogContent className="sm:max-w-xl">
					{voteState === "success" ? (
									<>
										<DialogHeader>
											<DialogTitle>
												<span className="flex items-center gap-2">
													<CheckCircle className="h-5 w-5 text-green-600" />
													Vote enregistré
												</span>
											</DialogTitle>
											<DialogDescription>
												Votre vote a été enregistré de manière anonyme et vérifiable. Conservez cette preuve : elle vous permet de retrouver votre vote dans le registre public et de vérifier qu&apos;il n&apos;a pas été modifié ou supprimé.
											</DialogDescription>
										</DialogHeader>
										{voteToken && (
											<div className="p-4 border border-border">
												<CopyableHash
													label="Votre code de vérification"
													tooltip="Conservez ce code pour vérifier votre vote plus tard. Il permet de prouver que votre vote est bien dans le registre public."
													value={voteToken}
												/>
												<p className="text-xs text-muted-foreground mt-2">
													Conservez ce code précieusement. Il est le seul moyen de vérifier que votre vote a bien été pris en compte.
												</p>
											</div>
										)}
										<Alert variant="warning">
										<AlertTriangle className="h-4 w-4" />
										<AlertDescription>
											Ne publiez pas cette preuve. Toute personne qui la voit peut retrouver votre vote dans le registre public et faire le lien avec vous.
										</AlertDescription>
									</Alert>
									{voteProof && (
											<div className="border border-border overflow-hidden">
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													src={`/api/poll/${poll.id}/vote-proof?sequence=${voteProof.sequence}&hash=${encodeURIComponent(voteProof.hash)}&token=${encodeURIComponent(voteToken)}&date=${encodeURIComponent(voteProof.createdAt)}`}
													alt={`Preuve de vote #${voteProof.sequence}`}
													className="w-full"
												/>
											</div>
										)}
										<DialogFooter className="flex-col sm:flex-row gap-2">
											{voteProof && (
												<Button variant="outline" asChild>
													<a href={`/api/poll/${poll.id}/vote-proof?sequence=${voteProof.sequence}&hash=${encodeURIComponent(voteProof.hash)}&token=${encodeURIComponent(voteToken)}&date=${encodeURIComponent(voteProof.createdAt)}`} download="preuve-vote.png">
														<Download className="h-4 w-4 mr-1.5" />
														Télécharger la preuve
													</a>
												</Button>
											)}
											<Button onClick={() => setConfirmOpen(false)}>
												Fermer
											</Button>
										</DialogFooter>
									</>
								) : voteState === "voting" ? (
									<>
										<DialogHeader>
											<DialogTitle>Vote en cours</DialogTitle>
											<DialogDescription>
												Votre vote pour <strong>{options.find((o) => o.id === selectedOption)?.label}</strong> est en cours de traitement.
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-3 py-2">
											{VOTE_STEPS.map((step, i) => {
												const currentIndex = VOTE_STEPS.findIndex((s) => s.key === voteStep);
												const isDone = i < currentIndex || (i === currentIndex && step.key === "done");
												const isCurrent = i === currentIndex && step.key !== "done";

												return (
													<div key={step.key} className="flex items-center gap-3">
														{isDone ? (
															<CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
														) : isCurrent ? (
															<Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
														) : (
															<div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
														)}
														<span className={`text-sm ${isDone ? "text-muted-foreground" : isCurrent ? "text-foreground font-medium" : "text-muted-foreground/50"}`}>
															{step.label}
														</span>
													</div>
												);
											})}
										</div>
									</>
								) : voteState === "error" ? (
									<>
										<DialogHeader>
											<DialogTitle>
												<span className="flex items-center gap-2">
													<XCircle className="h-5 w-5 text-destructive" />
													Erreur
												</span>
											</DialogTitle>
											<DialogDescription>{errorMessage}</DialogDescription>
										</DialogHeader>
										<DialogFooter>
											<Button variant="outline" onClick={() => { setConfirmOpen(false); setVoteState("idle"); }}>
												Fermer
											</Button>
										</DialogFooter>
									</>
								) : (
									<>
										<DialogHeader>
											<DialogTitle>Confirmer votre vote</DialogTitle>
											<DialogDescription>
												Vous êtes sur le point de voter{" "}
												<strong>{options.find((o) => o.id === selectedOption)?.label}</strong>.
											</DialogDescription>
										</DialogHeader>
										<Alert variant="warning">
										<AlertTriangle className="h-4 w-4" />
										<AlertDescription>
											Assurez-vous d&apos;être seul et à l&apos;abri des regards. Personne ne doit voir votre écran pendant que vous votez.
										</AlertDescription>
									</Alert>
										<p className="text-sm text-muted-foreground">
											Cette action est définitive. Votre vote sera enregistré de manière anonyme et ne pourra pas être modifié.
										</p>
										<DialogFooter>
											<Button variant="outline" onClick={() => setConfirmOpen(false)}>
												Annuler
											</Button>
											<Button onClick={handleVote}>
												Confirmer mon vote
											</Button>
										</DialogFooter>
									</>
								)}
				</DialogContent>
			</Dialog>
		</>
	);
}
