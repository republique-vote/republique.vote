"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { VoteDetailsCards } from "@/components/polls/vote-details-cards";
import { CheckCircle, XCircle } from "lucide-react";

interface VerifyResult {
	found: boolean;
	sequence?: number;
	optionLabel?: string;
	hash?: string;
	previousHash?: string | null;
	blindToken?: string;
	blindSignature?: string;
	createdAt?: string;
}

interface VerifyVoteDialogProps {
	pollId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialToken?: string;
}

export function VerifyVoteDialog({ pollId, open, onOpenChange, initialToken = "" }: VerifyVoteDialogProps) {
	const [token, setToken] = useState(initialToken);
	const [result, setResult] = useState<VerifyResult | null>(null);
	const [verifying, setVerifying] = useState(false);

	const handleVerify = useCallback(async () => {
		if (!token) return;
		setVerifying(true);
		setResult(null);
		try {
			const res = await fetch(`/api/poll/${pollId}/board?all=true`);
			const { data } = await res.json();
			const vote = data.votes.find((v: { blindToken: string }) => v.blindToken === token);
			if (vote) {
				const optionLabel = data.options?.find((o: { id: string }) => o.id === vote.optionId)?.label || vote.optionId;
				setResult({ found: true, sequence: vote.sequence, optionLabel, hash: vote.hash, previousHash: vote.previousHash, blindToken: vote.blindToken, blindSignature: vote.blindSignature, createdAt: vote.createdAt });
			} else {
				setResult({ found: false });
			}
		} catch {
			setResult({ found: false });
		}
		setVerifying(false);
	}, [token, pollId]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Vérifier mon vote</DialogTitle>
					<DialogDescription>
						Entrez votre code de vérification pour retrouver votre vote dans le registre public.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 overflow-hidden">
					<Input
						placeholder="Collez votre code de vérification ici"
						value={token}
						onChange={(e) => { setToken(e.target.value); setResult(null); }}
						className="font-mono text-xs"
					/>
					{result && result.found && (
						<div className="space-y-3">
							<Alert variant="success">
								<CheckCircle className="h-4 w-4" />
								<AlertTitle>Vote trouvé</AlertTitle>
								<AlertDescription>Votre vote est bien enregistré dans le registre public.</AlertDescription>
							</Alert>
							<VoteDetailsCards
								optionLabel={result.optionLabel}
								sequence={result.sequence}
								hash={result.hash}
								previousHash={result.previousHash}
								blindToken={result.blindToken}
								blindSignature={result.blindSignature}
								createdAt={result.createdAt}
							/>
						</div>
					)}
					{result && !result.found && (
						<Alert variant="destructive">
							<XCircle className="h-4 w-4" />
							<AlertTitle>Vote non trouvé</AlertTitle>
							<AlertDescription>Ce code ne correspond à aucun vote dans le registre. Vérifiez que vous avez bien copié le code.</AlertDescription>
						</Alert>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
					<Button onClick={handleVerify} disabled={!token || verifying}>
						{verifying ? "Recherche..." : "Vérifier"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
