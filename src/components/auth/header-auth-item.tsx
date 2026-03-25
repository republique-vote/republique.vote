"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useSession, signOut } from "@/services/auth/client";

const logoutModal = createModal({
  isOpenedByDefault: false,
  id: "logout-modal",
});

export function HeaderAuthItem() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) return null;

  if (session) {
    return (
      <>
        <button
          className="fr-btn fr-btn--tertiary-no-outline fr-icon-account-circle-line"
          onClick={() => logoutModal.open()}
        >
          {session.user.name}
        </button>
        {typeof document !== "undefined" &&
          createPortal(
            <logoutModal.Component
              title="Se déconnecter"
              size="medium"
              buttons={[
                {
                  children: "Annuler",
                  priority: "secondary",
                  doClosesModal: true,
                },
                {
                  children: "Se déconnecter",
                  onClick: () => signOut({ fetchOptions: { onSuccess: () => router.refresh() } }),
                },
              ]}
            >
              <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
            </logoutModal.Component>,
            document.body,
          )}
      </>
    );
  }

  return (
    <Link className="fr-btn fr-btn--tertiary-no-outline fr-icon-account-circle-line" href="/login">
      Se connecter
    </Link>
  );
}
