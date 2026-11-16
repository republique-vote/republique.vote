import {
  type Chamber,
  Hemicycle,
  type HemicycleGroup,
  type HemicycleVote,
} from "@/components/polls/poll-detail/hemicycle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChamberVotes {
  groups: HemicycleGroup[];
  votes: HemicycleVote[];
}

const TAB_LABELS: Record<Chamber, string> = {
  assembly: "Députés",
  senate: "Sénateurs",
  congress: "Congrès",
};

// How each member of parliament voted: one tab per chamber that voted, the
// deputies first since their vote closes the citizen vote
export function ParliamentVotes({
  deputies,
  senators,
  congress,
}: {
  deputies: ChamberVotes | null;
  senators: ChamberVotes | null;
  congress: ChamberVotes | null;
}) {
  const chambers = (
    [
      ["assembly", deputies],
      ["senate", senators],
      ["congress", congress],
    ] as const
  ).filter((entry): entry is [Chamber, ChamberVotes] => entry[1] !== null);

  if (chambers.length === 0) {
    return null;
  }
  if (chambers.length === 1) {
    const [chamber, votes] = chambers[0];
    return <Hemicycle chamber={chamber} {...votes} />;
  }

  return (
    <section className="mt-6">
      <h2 className="mb-3 font-medium text-sm">
        Comment ont voté les parlementaires
      </h2>
      <Tabs defaultValue={chambers[0][0]}>
        <TabsList variant="framed">
          {chambers.map(([chamber]) => (
            <TabsTrigger key={chamber} value={chamber}>
              {TAB_LABELS[chamber]}
            </TabsTrigger>
          ))}
        </TabsList>
        {chambers.map(([chamber, votes]) => (
          <TabsContent key={chamber} value={chamber} variant="framed">
            <Hemicycle chamber={chamber} embedded {...votes} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
