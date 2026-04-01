"use client";

interface FranceConnectButtonProps {
  onClick: () => void;
}

export function FranceConnectButton({ onClick }: FranceConnectButtonProps) {
  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-center text-muted-foreground text-sm">
        FranceConnect est la solution proposée par l&apos;État pour sécuriser et
        simplifier la connexion à vos services en ligne.
      </p>
      <button
        aria-label="S'identifier avec FranceConnect"
        className="group relative h-14 w-52.25 cursor-pointer border-0 bg-transparent p-0"
        onClick={onClick}
        type="button"
      >
        {/* biome-ignore lint/performance/noImgElement: official FC SVGs, no optimization needed */}
        <img
          alt="S'identifier avec FranceConnect"
          className="pointer-events-none absolute inset-0 opacity-100 group-hover:opacity-0 dark:opacity-0"
          decoding="sync"
          draggable={false}
          height={56}
          src="/franceconnect/franceconnect-btn-principal.svg"
          width={209}
        />
        {/* biome-ignore lint/performance/noImgElement: official FC SVGs, no optimization needed */}
        <img
          alt=""
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 dark:opacity-0"
          decoding="sync"
          draggable={false}
          height={56}
          src="/franceconnect/franceconnect-btn-principal-hover.svg"
          width={209}
        />
        {/* biome-ignore lint/performance/noImgElement: official FC SVGs, no optimization needed */}
        <img
          alt=""
          className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100 dark:group-hover:opacity-0"
          decoding="sync"
          draggable={false}
          height={56}
          src="/franceconnect/franceconnect-btn-alt.svg"
          width={209}
        />
        {/* biome-ignore lint/performance/noImgElement: official FC SVGs, no optimization needed */}
        <img
          alt=""
          className="pointer-events-none absolute inset-0 opacity-0 dark:group-hover:opacity-100"
          decoding="sync"
          draggable={false}
          height={56}
          src="/franceconnect/franceconnect-btn-alt-hover.svg"
          width={209}
        />
      </button>
      <a
        className="mt-3 text-primary text-sm underline hover:text-primary/80"
        href="https://franceconnect.gouv.fr/"
        rel="noopener noreferrer"
        target="_blank"
      >
        Qu&apos;est-ce que FranceConnect ?
      </a>
    </div>
  );
}
