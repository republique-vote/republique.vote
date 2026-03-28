import Link from "next/link";

export function BrandLogo() {
  return (
    <Link className="flex flex-col items-start leading-tight" href="/">
      <span className="font-bold text-[0.8rem] text-foreground uppercase tracking-[0.08em]">
        republique
      </span>
      <span className="font-bold text-[0.8rem] text-foreground uppercase tracking-[0.08em]">
        .vote
      </span>
      <span className="mt-1 bg-amber-500 px-1 py-0.5 font-bold text-[0.55rem] text-white uppercase">
        Proof of concept
      </span>
    </Link>
  );
}
