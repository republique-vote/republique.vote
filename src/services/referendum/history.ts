import { eq } from "drizzle-orm";
import { db } from "@/db";
import { option, poll, referendumResult } from "@/db/schema";

// National referendums of the Fifth Republic, with the results proclaimed by
// the Conseil constitutionnel (by the national vote counting commission in
// 1958, before the Conseil existed). Percentages are computed from these
// figures, on the votes cast.
interface HistoricalReferendum {
  // Constitutional basis, e.g. "l'article 11 de la Constitution"
  basis: string;
  blankAndNull: number;
  date: string;
  expressed: number;
  no: number;
  // Exact question asked to voters, null when the official wording could not
  // be checked
  question: string | null;
  registered: number;
  // Territory covered by the proclaimed totals, when it needs explaining
  scopeNote: string | null;
  sourceUrl: string;
  // What the voters approved or rejected
  subject: string;
  title: string;
  voters: number;
  yes: number;
}

export const HISTORICAL_REFERENDUMS: HistoricalReferendum[] = [
  {
    title: "Référendum de 1958 : Constitution de la Ve République",
    date: "1958-09-28",
    basis: "la loi constitutionnelle du 3 juin 1958",
    subject: "la Constitution de la Ve République",
    question:
      "Approuvez-vous la Constitution qui vous est proposée par le Gouvernement de la République ?",
    registered: 45_840_642,
    voters: 36_893_979,
    blankAndNull: 407_728,
    expressed: 36_486_251,
    yes: 31_066_502,
    no: 5_419_749,
    scopeNote:
      "Totaux proclamés pour la métropole, l'Algérie, le Sahara et l'outre-mer, sans la Guinée, qui a voté non et est devenue indépendante quelques jours plus tard.",
    sourceUrl: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000571394",
  },
  {
    title: "Référendum de 1961 : autodétermination de l'Algérie",
    date: "1961-01-08",
    basis: "l'article 11 de la Constitution",
    subject:
      "le projet de loi concernant l'autodétermination des populations algériennes",
    question:
      "Approuvez-vous le projet de loi soumis au peuple français par le président de la République et concernant l'autodétermination des populations algériennes et l'organisation des pouvoirs publics en Algérie avant l'autodétermination ?",
    registered: 32_520_233,
    voters: 23_986_913,
    blankAndNull: 721_469,
    expressed: 23_265_444,
    yes: 17_447_669,
    no: 5_817_775,
    scopeNote:
      "Totaux proclamés pour la métropole, les départements algériens, le Sahara et l'outre-mer.",
    sourceUrl: "https://www.legifrance.gouv.fr/cons/id/CONSTEXT000017665193/",
  },
  {
    title: "Référendum d'avril 1962 : accords d'Évian",
    date: "1962-04-08",
    basis: "l'article 11 de la Constitution",
    subject: "les accords d'Évian sur l'Algérie",
    question:
      "Approuvez-vous le projet de loi soumis au peuple français par le président de la République et concernant les accords à établir et les mesures à prendre au sujet de l'Algérie sur la base des déclarations gouvernementales du 19 mars 1962 ?",
    registered: 27_582_072,
    voters: 20_779_303,
    blankAndNull: 1_103_806,
    expressed: 19_675_497,
    yes: 17_866_423,
    no: 1_809_074,
    scopeNote:
      "Totaux proclamés pour la métropole et l'outre-mer, sans l'Algérie, qui a voté séparément le 1er juillet 1962.",
    sourceUrl: "https://www.legifrance.gouv.fr/cons/id/CONSTEXT000017665212",
  },
  {
    title:
      "Référendum d'octobre 1962 : élection du président au suffrage universel",
    date: "1962-10-28",
    basis: "l'article 11 de la Constitution",
    subject: "l'élection du président de la République au suffrage universel",
    question:
      "Approuvez-vous le projet de loi soumis au peuple français par le président de la République et relatif à l'élection du président de la République au suffrage universel ?",
    registered: 28_185_478,
    voters: 21_694_563,
    blankAndNull: 569_509,
    expressed: 21_125_054,
    yes: 13_150_516,
    no: 7_974_538,
    scopeNote: null,
    sourceUrl: "https://www.legifrance.gouv.fr/cons/id/CONSTEXT000017665213/",
  },
  {
    title: "Référendum de 1969 : régions et réforme du Sénat",
    date: "1969-04-27",
    basis: "l'article 11 de la Constitution",
    subject: "la création de régions et la rénovation du Sénat",
    question:
      "Approuvez-vous le projet de loi soumis au peuple français par le président de la République et relatif à la création de régions et à la rénovation du Sénat ?",
    registered: 29_392_390,
    voters: 23_552_611,
    blankAndNull: 643_756,
    expressed: 22_908_855,
    yes: 10_901_753,
    no: 12_007_102,
    scopeNote: null,
    sourceUrl: "https://www.legifrance.gouv.fr/cons/id/CONSTEXT000017665497",
  },
  {
    title: "Référendum de 1972 : élargissement des Communautés européennes",
    date: "1972-04-23",
    basis: "l'article 11 de la Constitution",
    subject:
      "l'adhésion de la Grande-Bretagne, du Danemark, de l'Irlande et de la Norvège aux Communautés européennes",
    question:
      "Approuvez-vous, dans les perspectives nouvelles qui s'ouvrent à l'Europe, le projet de loi soumis au peuple français par le président de la République, et autorisant la ratification du traité relatif à l'adhésion de la Grande-Bretagne, du Danemark, de l'Irlande et de la Norvège aux Communautés européennes ?",
    registered: 29_820_464,
    voters: 17_964_607,
    blankAndNull: 2_086_119,
    expressed: 15_878_488,
    yes: 10_847_554,
    no: 5_030_934,
    scopeNote: null,
    sourceUrl: "https://www.legifrance.gouv.fr/cons/id/CONSTEXT000017665626",
  },
  {
    title: "Référendum de 1988 : avenir de la Nouvelle-Calédonie",
    date: "1988-11-06",
    basis: "l'article 11 de la Constitution",
    subject:
      "le projet de loi portant dispositions statutaires et préparatoires à l'autodétermination de la Nouvelle-Calédonie en 1998, issu des accords de Matignon",
    // The sources disagree on the exact wording
    question: null,
    registered: 38_025_823,
    voters: 14_028_705,
    blankAndNull: 1_657_659,
    expressed: 12_371_046,
    yes: 9_896_498,
    no: 2_474_548,
    scopeNote: null,
    sourceUrl: "https://www.legifrance.gouv.fr/juri/id/CONSTEXT000017667501",
  },
  {
    title: "Référendum de 1992 : traité de Maastricht",
    date: "1992-09-20",
    basis: "l'article 11 de la Constitution",
    subject: "la ratification du traité sur l'Union européenne",
    question:
      "Approuvez-vous le projet de loi soumis au peuple français par le président de la République autorisant la ratification du traité sur l'Union européenne ?",
    registered: 38_305_534,
    voters: 26_695_951,
    blankAndNull: 909_377,
    expressed: 25_786_574,
    yes: 13_162_992,
    no: 12_623_582,
    scopeNote: null,
    sourceUrl: "https://www.legifrance.gouv.fr/juri/id/CONSTEXT000017667514",
  },
  {
    title: "Référendum de 2000 : quinquennat",
    date: "2000-09-24",
    basis: "l'article 89 de la Constitution",
    subject: "la réduction à cinq ans du mandat du président de la République",
    question:
      "Approuvez-vous le projet de loi constitutionnelle fixant la durée du mandat du Président de la République à cinq ans ?",
    registered: 39_941_192,
    voters: 12_058_688,
    blankAndNull: 1_940_340,
    expressed: 10_118_348,
    yes: 7_407_697,
    no: 2_710_651,
    scopeNote: null,
    sourceUrl: "https://www.legifrance.gouv.fr/juri/id/CONSTEXT000017664374",
  },
  {
    title: "Référendum de 2005 : Constitution européenne",
    date: "2005-05-29",
    basis: "l'article 11 de la Constitution",
    subject:
      "la ratification du traité établissant une Constitution pour l'Europe",
    question:
      "Approuvez-vous le projet de loi qui autorise la ratification du traité établissant une Constitution pour l'Europe ?",
    registered: 41_789_202,
    voters: 28_988_300,
    blankAndNull: 730_522,
    expressed: 28_257_778,
    yes: 12_808_270,
    no: 15_449_508,
    scopeNote: null,
    sourceUrl: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000447940",
  },
];

function description(r: HistoricalReferendum) {
  const question = r.question ? `\n\nQuestion posée : « ${r.question} »` : "";
  return `Référendum organisé en application de ${r.basis}. Les électeurs étaient appelés à approuver ou rejeter ${r.subject}.${question}\n\nEt vous, qu'auriez-vous voté ?`;
}

function officialResult(r: HistoricalReferendum) {
  return {
    date: r.date,
    registered: r.registered,
    voters: r.voters,
    blankAndNull: r.blankAndNull,
    expressed: r.expressed,
    yes: r.yes,
    no: r.no,
    scopeNote: r.scopeNote,
    sourceUrl: r.sourceUrl,
  };
}

// Creates the missing historical referendums. They stay open: the point is to
// compare today's citizens with the voters of the time
export async function seedHistoricalReferendums(): Promise<number> {
  let created = 0;
  for (const r of HISTORICAL_REFERENDUMS) {
    const sourceRef = `referendum-${r.date}`;
    const existing = await db.query.poll.findFirst({
      where: eq(poll.sourceRef, sourceRef),
    });
    // Corrections to the text or figures reach referendums already created
    if (existing) {
      await db
        .update(poll)
        .set({ title: r.title, description: description(r) })
        .where(eq(poll.id, existing.id));
      await db
        .update(referendumResult)
        .set(officialResult(r))
        .where(eq(referendumResult.pollId, existing.id));
      continue;
    }
    const pollId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(poll).values({
        id: pollId,
        title: r.title,
        description: description(r),
        type: "referendum",
        status: "open",
        // The citizen vote opens today; the referendum date orders the list
        startDate: new Date().toLocaleDateString("sv-SE", {
          timeZone: "Europe/Paris",
        }),
        createdAt: r.date,
        endDate: null,
        // The official result block links the proclamation
        sourceUrl: null,
        sourceRef,
      });
      await tx.insert(option).values([
        { pollId, label: "Oui", position: 1 },
        { pollId, label: "Non", position: 2 },
        { pollId, label: "Blanc", position: 3 },
      ]);
      await tx
        .insert(referendumResult)
        .values({ pollId, ...officialResult(r) });
    });
    created++;
  }
  return created;
}
