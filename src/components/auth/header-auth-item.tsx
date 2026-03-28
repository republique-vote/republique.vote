"use client";

import { LogIn, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signOut, useSession } from "@/services/auth/client";

export function HeaderAuthItem() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (isPending) {
    return null;
  }

  if (session) {
    return (
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogTrigger asChild>
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-sm px-3 font-medium text-primary text-sm transition-colors hover:bg-accent"
            type="button"
          >
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
            <Button onClick={() => setOpen(false)} variant="outline">
              Annuler
            </Button>
            <Button
              onClick={() =>
                signOut({ fetchOptions: { onSuccess: () => router.refresh() } })
              }
            >
              Se déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Link
      className="inline-flex h-8 items-center gap-1.5 rounded-sm px-3 font-medium text-primary text-sm transition-colors hover:bg-accent"
      href="/login"
    >
      <LogIn className="h-4 w-4" />
      Se connecter
    </Link>
  );
}
