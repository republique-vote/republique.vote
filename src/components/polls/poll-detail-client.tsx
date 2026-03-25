"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { fr } from "@codegouvfr/react-dsfr";
import { useSession } from "@/services/auth/client";
import {
	generateToken,
	blindToken,
	finalizeSignature,
	toBase64,
} from "@/services/blind-signature/client";

const confirmVoteModal = createModal({
	isOpenedByDefault: false,
	id: "confirm-vote-modal",
});

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

		eventSource.onmessage = (event) => {
			setData(JSON.parse(event.data));
		};

		eventSource.onerror = () => {
			eventSource.close();
		};

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
	const [errorMessage, setErrorMessage] = useState("");
	const [hasVoted, setHasVoted] = useState(initialHasVoted);

	const isOpen = poll.status === "open";
	const isAuthenticated = !!session;
	const canVote = isOpen && isAuthenticated && !hasVoted && voteState !== "success";

	const results = sseResults?.results || [];
	const totalVotes = sseResults?.totalVotes || initialVoteCount;

	const handleVote = useCallback(async () => {
		if (!selectedOption) return;

		setVoteState("voting");
		setErrorMessage("");

		try {
			const pkRes = await fetch(`/api/poll/${poll.id}/public-key`);
			const { data: pkData } = await pkRes.json();

			const token = generateToken();
			const { blindedMsg, inv } = await blindToken(token, pkData.publicKey);

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
			const blindSig = Uint8Array.from(atob(signData.blindSignature), (c) =>
				c.charCodeAt(0),
			);

			const signature = await finalizeSignature(
				pkData.publicKey,
				token,
				blindSig,
				inv,
			);

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

			setVoteState("success");
			setHasVoted(true);
		} catch (err) {
			setVoteState("error");
			setErrorMessage(
				err instanceof Error ? err.message : "Une erreur est survenue",
			);
		}
	}, [selectedOption, poll.id]);

	return (
		<>
			<p className={fr.cx("fr-text--sm")} style={{ color: "var(--text-mention-grey)" }}>
				{totalVotes} vote{totalVotes !== 1 ? "s" : ""} enregistré
				{totalVotes !== 1 ? "s" : ""}
				{" · "}
				{isOpen ? (
					<>
						{"Jusqu'au "}
						{formatDate(poll.endDate)}
						{" · "}
						{countdown || "Vote terminé"}
					</>
				) : (
					<>
						Du {formatDate(poll.startDate)} au {formatDate(poll.endDate)}
					</>
				)}
			</p>

			{voteState === "success" && (
				<div className={fr.cx("fr-mb-4w")}>
					<Alert
						severity="success"
						title="Vote enregistré"
						description="Votre vote a été enregistré de manière anonyme et vérifiable."
						className={fr.cx("fr-mb-2w")}
					/>
					<Button priority="secondary" linkProps={{ href: "/polls" }}>
						Voir les autres votes
					</Button>
				</div>
			)}

			{voteState === "error" && (
				<Alert
					severity="error"
					title="Erreur"
					description={errorMessage}
					className={fr.cx("fr-mb-4w")}
				/>
			)}

			{isAuthenticated && hasVoted && voteState !== "success" && (
				<div className={fr.cx("fr-mb-4w")}>
					<Alert
						severity="info"
						title="Vous avez déjà voté"
						description="Vous avez déjà participé à ce vote."
						className={fr.cx("fr-mb-2w")}
					/>
					<Button priority="secondary" linkProps={{ href: "/polls" }}>
						Voir les autres votes
					</Button>
				</div>
			)}

			{isOpen && !isAuthenticated && (
				<div className={fr.cx("fr-mb-4w")}>
					<Alert
						severity="warning"
						title="Connexion requise"
						description="Vous devez vous identifier via FranceConnect pour voter."
						className={fr.cx("fr-mb-2w")}
					/>
					<Button linkProps={{ href: "/login" }}>
						Se connecter
					</Button>
				</div>
			)}

			<div className={fr.cx("fr-mb-4w")}>
				{canVote && (
					<p className={fr.cx("fr-text--sm", "fr-mb-2w")} style={{ color: "var(--text-mention-grey)" }}>
						Sélectionnez une option pour voter
					</p>
				)}
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
								style={{
									position: "relative",
									overflow: "hidden",
									padding: "16px 20px",
									border: isSelected
										? "2px solid var(--text-action-high-blue-france)"
										: "1px solid var(--border-default-grey)",
									borderRadius: "4px",
									background: "var(--background-default-grey)",
									cursor: canVote ? "pointer" : "default",
									textAlign: "left",
									transition: "border-color 0.2s ease",
								}}
							>
								<div
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										height: "100%",
										width: `${percentage}%`,
										backgroundColor: isSelected
											? "var(--background-action-high-blue-france)"
											: "var(--background-contrast-grey)",
										opacity: isSelected ? 0.12 : 0.5,
										transition: "width 0.3s ease",
									}}
								/>
								<div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
									<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
										{canVote && (
											<div
												style={{
													width: "20px",
													height: "20px",
													borderRadius: "50%",
													border: isSelected
														? "6px solid var(--text-action-high-blue-france)"
														: "2px solid var(--border-default-grey)",
													flexShrink: 0,
													transition: "border 0.2s ease",
												}}
											/>
										)}
										<span style={{ fontWeight: "bold" }}>{opt.label}</span>
									</div>
									<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
										<span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
											{percentage}%
										</span>
										<span style={{ fontSize: "0.875rem", color: "var(--text-mention-grey)" }}>
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
							className={fr.cx("fr-mt-2w")}
							onClick={() => confirmVoteModal.open()}
							disabled={!selectedOption || voteState === "voting"}
						>
							Voter
						</Button>
						<confirmVoteModal.Component
							title="Confirmer votre vote"
							size="medium"
							buttons={[
								{
									children: "Annuler",
									priority: "secondary",
									doClosesModal: true,
								},
								{
									children: voteState === "voting" ? "Vote en cours..." : "Confirmer mon vote",
									disabled: voteState === "voting",
									onClick: () => {
										handleVote();
										confirmVoteModal.close();
									},
								},
							]}
						>
							<p>
								Vous êtes sur le point de voter{" "}
								<strong>
									{options.find((o) => o.id === selectedOption)?.label}
								</strong>
								.
							</p>
							<p className={fr.cx("fr-text--sm")} style={{ color: "var(--text-mention-grey)" }}>
								Cette action est irréversible. Votre vote sera enregistré de
								manière anonyme et ne pourra pas être modifié.
							</p>
						</confirmVoteModal.Component>
					</>
				)}
			</div>
		</>
	);
}
