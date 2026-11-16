import {
  Hemicycle,
  type HemicycleGroup,
  type HemicycleVote,
} from "@/components/polls/poll-detail/hemicycle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChamberVotes {
  groups: HemicycleGroup[];
  votes: HemicycleVote[];
}

// How each member of parliament voted: one tab per chamber when both voted,
// the deputies first since their vote closes the citizen vote
export function ParliamentVotes({
  deputies,
  senators,
}: {
  deputies: ChamberVotes | null;
  senators: ChamberVotes | null;
}) {
  if (!(deputies && senators)) {
    if (deputies) {
      return <Hemicycle chamber="assembly" {...deputies} />;
    }
    return senators ? <Hemicycle chamber="senate" {...senators} /> : null;
  }

  return (
    <section className="mt-6">
      <h2 className="mb-3 font-medium text-sm">
        Comment ont voté les parlementaires
      </h2>
      <Tabs defaultValue="assembly">
        <TabsList variant="framed">
          <TabsTrigger value="assembly">Députés</TabsTrigger>
          <TabsTrigger value="senate">Sénateurs</TabsTrigger>
        </TabsList>
        <TabsContent value="assembly" variant="framed">
          <Hemicycle chamber="assembly" embedded {...deputies} />
        </TabsContent>
        <TabsContent value="senate" variant="framed">
          <Hemicycle chamber="senate" embedded {...senators} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
