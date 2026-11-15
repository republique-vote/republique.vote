import { notFound } from "next/navigation";
import { ZkPassportTest } from "@/components/zkpassport/zkpassport-test";

export default function ZkPassportTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-bold text-3xl tracking-tight">Test ZKPassport</h1>
      <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
        Vérifie qu'une carte d'identité française permet de prouver la
        nationalité et la majorité, avec un identifiant unique stable.
      </p>
      <ZkPassportTest />
    </div>
  );
}
