import Link from "next/link";

export function BrandLogo() {
  return (
    <Link href="/" className="flex flex-col leading-tight items-start">
      <span className="text-[0.8rem] font-bold uppercase tracking-[0.08em] text-foreground">republique</span>
      <span className="text-[0.8rem] font-bold uppercase tracking-[0.08em] text-foreground">.vote</span>
      <span className="text-[0.55rem] font-bold uppercase px-1 py-0.5 bg-amber-500 text-white mt-1">Proof of concept</span>
    </Link>
  );
}
