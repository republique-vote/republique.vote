"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/services/auth/client";
import { Button } from "@/components/ui/button";
import { UserCircle, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function HeaderAuthItem() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (isPending) return null;

  if (session) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-primary hover:bg-accent rounded-sm transition-colors">
            <UserCircle className="h-4 w-4" />
            {session.user.name}
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Se déconnecter</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => signOut({ fetchOptions: { onSuccess: () => router.refresh() } })}>
              Se déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Link href="/login" className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-primary hover:bg-accent rounded-sm transition-colors">
      <LogIn className="h-4 w-4" />
      Se connecter
    </Link>
  );
}
