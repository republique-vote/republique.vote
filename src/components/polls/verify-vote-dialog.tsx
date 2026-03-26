"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CopyableHash } from "@/components/ui/copyable-hash";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	CheckCircle,
	XCircle,
	HelpCircle,
	ListOrdered,
	Hash,
	Calendar,
} from "lucide-react";

interface VerifyResult {
	found: boolean;
	sequence?: number;
	hash?: string;
	optionId?: string;
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
				setResult({ found: true, sequence: vote.sequence, hash: vote.hash, optionId: vote.optionId, createdAt: vote.createdAt });
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
							<div className="space-y-2">
								<div className="flex items-center gap-3 p-3 border border-border bg-card">
									<ListOrdered className="h-4 w-4 text-muted-foreground shrink-0" />
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-1.5">
											<span className="text-xs text-muted-foreground">Position dans le registre</span>
											<Tooltip>
												<TooltipTrigger asChild>
													<HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
												</TooltipTrigger>
												<TooltipContent className="max-w-xs">
													<p>Le numéro d&apos;ordre de votre vote dans le registre public. Chaque vote reçoit un numéro unique.</p>
												</TooltipContent>
											</Tooltip>
										</div>
										<p className="text-sm font-semibold">#{result.sequence}</p>
									</div>
								</div>
								<div className="flex items-center gap-3 p-3 border border-border bg-card overflow-hidden">
									<Hash className="h-4 w-4 text-muted-foreground shrink-0" />
									<div className="flex-1 min-w-0 overflow-hidden">
										<div className="flex items-center gap-1.5">
											<span className="text-xs text-muted-foreground">Empreinte cryptographique</span>
											<Tooltip>
												<TooltipTrigger asChild>
													<HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
												</TooltipTrigger>
												<TooltipContent className="max-w-xs">
													<p>Un code unique calculé à partir de votre vote. Si quelqu&apos;un modifie le vote, ce code change, ce qui rend la fraude détectable.</p>
												</TooltipContent>
											</Tooltip>
										</div>
										<div className="mt-1">
											<CopyableHash value={result.hash || ""} />
										</div>
									</div>
								</div>
								<div className="flex items-center gap-3 p-3 border border-border bg-card">
									<Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-1.5">
											<span className="text-xs text-muted-foreground">Date d&apos;enregistrement</span>
											<Tooltip>
												<TooltipTrigger asChild>
													<HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
												</TooltipTrigger>
												<TooltipContent className="max-w-xs">
													<p>Le moment exact où votre vote a été inscrit dans le registre public.</p>
												</TooltipContent>
											</Tooltip>
										</div>
										<p className="text-sm font-semibold">{result.createdAt && new Date(result.createdAt).toLocaleString("fr-FR")}</p>
									</div>
								</div>
							</div>
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
