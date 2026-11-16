"use client";

import { useMemo, useState } from "react";
import { DeputyAvatar } from "@/components/polls/poll-detail/deputy-avatar";
import { HEMICYCLE_PLAN } from "@/components/polls/poll-detail/hemicycle-plan";
import { VOTE_FILL_CLASSES } from "@/components/polls/poll-detail/vote-colors";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { deputyPhotoUrl } from "@/services/assembly/photo";

type SeatPosition = "for" | "against" | "abstention" | "nonVoting" | "absent";

export interface HemicycleGroup {
  abbrev: string | null;
  abstentionCount: number;
  againstCount: number;
  color: string | null;
  forCount: number;
  groupRef: string;
  members: number;
  name: string;
  nonVotingCount: number;
  seatOrder: number;
}

export interface HemicycleVote {
  firstName: string;
  groupRef: string;
  id: string;
  lastName: string;
  photoLegislature: string | null;
  position: SeatPosition;
  // Seat number in the hemicycle, null when unknown
  seat: number | null;
}

interface Seat {
  groupName: string;
  label: string;
  photoUrl: string | null;
  position: SeatPosition;
  voterId: string;
  x: number;
  y: number;
}

const POSITION_ORDER: SeatPosition[] = [
  "for",
  "against",
  "abstention",
  "nonVoting",
  "absent",
];

const POSITION_LABELS: Record<SeatPosition, string> = {
  for: "Pour",
  against: "Contre",
  abstention: "Abstention",
  nonVoting: "Non votant",
  absent: "Absent",
};

const SEARCH_RESULTS: Record<SeatPosition, string> = {
  for: " a voté pour",
  against: " a voté contre",
  abstention: " s'est abstenu",
  nonVoting: " n'a pas pris part au vote",
  absent: " était absent",
};

const POSITION_CLASSES: Record<SeatPosition, string> = {
  ...VOTE_FILL_CLASSES,
  nonVoting: "fill-muted-foreground",
  absent: "fill-muted stroke-border",
};

// Seats of the real room, numbered as in the Assemblée, with its aisles
const PLAN = Object.entries(HEMICYCLE_PLAN).map(([seat, [x, y]]) => ({
  seat: Number(seat),
  x,
  y,
}));
const SEAT_RADIUS = 6;
const MARGIN = SEAT_RADIUS + 2;
const xs = PLAN.map((p) => p.x);
const ys = PLAN.map((p) => p.y);
const VIEW_BOX = {
  x: Math.min(...xs) - MARGIN,
  y: Math.min(...ys) - MARGIN,
  width: Math.max(...xs) - Math.min(...xs) + MARGIN * 2,
  height: Math.max(...ys) - Math.min(...ys) + MARGIN * 2,
};

// Thicker outline on the active seat, thin one on empty (absent) seats
function seatStroke(seat: Seat, isActive: boolean) {
  if (isActive) {
    return 2;
  }
  return seat.position === "absent" ? 1 : 0;
}

function fullName(vote: HemicycleVote) {
  return `${vote.firstName} ${vote.lastName.toUpperCase()}`;
}

export function DeputyHemicycle({
  groups,
  votes,
}: {
  groups: HemicycleGroup[];
  votes: HemicycleVote[];
}) {
  const [query, setQuery] = useState("");
  // Seat under the pointer (or last tapped on touch screens)
  const [active, setActive] = useState<number | null>(null);

  // Real left-to-right placement: seats are numbered from the right
  const ordered = useMemo(
    () => [...groups].sort((a, b) => b.seatOrder - a.seatOrder),
    [groups]
  );

  // Each member at their own seat; seats nobody holds stay empty
  const seats = useMemo(() => {
    const groupNames = new Map(groups.map((g) => [g.groupRef, g.name]));
    const bySeat = new Map(
      votes.filter((v) => v.seat !== null).map((v) => [v.seat, v])
    );
    return PLAN.map((place): Seat | null => {
      const vote = bySeat.get(place.seat);
      if (!vote) {
        return null;
      }
      return {
        groupName: groupNames.get(vote.groupRef) ?? "",
        label: fullName(vote),
        photoUrl: deputyPhotoUrl(vote.id, vote.photoLegislature),
        position: vote.position,
        voterId: vote.id,
        x: place.x,
        y: place.y,
      };
    });
  }, [groups, votes]);

  const normalizedQuery = query
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const matches =
    normalizedQuery.length >= 2
      ? votes.filter((v) =>
          fullName(v)
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .includes(normalizedQuery)
        )
      : [];
  const highlighted = new Set(matches.map((m) => m.id));
  const viewBox = VIEW_BOX;
  const seatRadius = SEAT_RADIUS;
  const activeSeat = active === null ? null : seats[active];
  // Members counted by their group but missing from the chart
  const unplaced =
    groups.reduce((sum, g) => sum + g.members, 0) -
    seats.filter((seat) => seat !== null).length;

  return (
    <section className="mt-6 space-y-4 border border-border p-4">
      <h2 className="font-medium text-sm">Comment ont voté les députés</h2>

      <div className="relative">
        <svg
          aria-label="Hémicycle : vote de chaque député, à sa place dans l'Assemblée"
          className="w-full"
          onPointerLeave={() => setActive(null)}
          onPointerOver={(event) => {
            const index = (event.target as SVGElement).dataset.seat;
            if (index !== undefined) {
              setActive(Number(index));
            }
          }}
          role="img"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        >
          {seats.map((seat, i) =>
            seat ? (
              <circle
                className={`${POSITION_CLASSES[seat.position]} ${
                  highlighted.size > 0 && !highlighted.has(seat.voterId)
                    ? "opacity-20"
                    : ""
                } ${active === i ? "stroke-foreground" : ""}`}
                cx={seat.x}
                cy={seat.y}
                data-seat={i}
                key={PLAN[i].seat}
                r={seatRadius}
                strokeWidth={seatStroke(seat, active === i)}
              />
            ) : (
              <circle
                className="fill-none stroke-border"
                cx={PLAN[i].x}
                cy={PLAN[i].y}
                key={PLAN[i].seat}
                r={seatRadius}
                strokeWidth={0.75}
              />
            )
          )}
        </svg>
        {/* One tooltip for the whole chart, anchored on the active seat: a
            tooltip per seat would mean hundreds of instances */}
        {activeSeat ? (
          <Tooltip key={active} open>
            <TooltipTrigger asChild>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute size-0"
                style={{
                  left: `${((activeSeat.x - viewBox.x) / viewBox.width) * 100}%`,
                  top: `${((activeSeat.y - viewBox.y - seatRadius) / viewBox.height) * 100}%`,
                }}
              />
            </TooltipTrigger>
            <TooltipContent
              className="pointer-events-none"
              collisionPadding={8}
              sideOffset={4}
            >
              <DeputyAvatar
                name={activeSeat.label}
                photoUrl={activeSeat.photoUrl}
                size={32}
              />
              <p>
                <span className="font-medium">{activeSeat.label}</span>
                <br />
                {activeSeat.groupName} · {POSITION_LABELS[activeSeat.position]}
              </p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
        {POSITION_ORDER.map((position) => (
          <span className="inline-flex items-center gap-1.5" key={position}>
            <svg aria-hidden="true" className="size-2.5" viewBox="0 0 10 10">
              <circle
                className={POSITION_CLASSES[position]}
                cx="5"
                cy="5"
                r="4.5"
                strokeWidth={position === "absent" ? 1 : 0}
              />
            </svg>
            {POSITION_LABELS[position]}
          </span>
        ))}
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Un député absent n'est pas forcément inactif : il peut être en
        commission, en circonscription ou en déplacement au moment du vote.
        {unplaced > 0
          ? ` ${unplaced} député${unplaced > 1 ? "s" : ""} dont la place n'est pas connue ${unplaced > 1 ? "sont comptés" : "est compté"} seulement dans le détail par groupe.`
          : ""}
      </p>

      <div className="space-y-2">
        <Input
          aria-label="Chercher un député"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Chercher un député, par exemple votre député"
          value={query}
        />
        {matches.slice(0, 5).map((m) => (
          <p className="text-sm" key={m.id}>
            <span className="font-medium">{fullName(m)}</span>
            {SEARCH_RESULTS[m.position]}
          </p>
        ))}
        {normalizedQuery.length >= 2 && matches.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun député de ce nom dans l'hémicycle ce jour-là.
          </p>
        ) : null}
      </div>

      <ul className="space-y-1.5 border-border border-t pt-4 text-xs">
        {ordered.map((group) => {
          const absent = Math.max(
            group.members -
              group.forCount -
              group.againstCount -
              group.abstentionCount -
              group.nonVotingCount,
            0
          );
          return (
            <li
              className="flex flex-wrap items-center justify-between gap-x-3"
              key={group.groupRef}
            >
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: group.color ?? "currentColor" }}
                />
                {group.name}
              </span>
              <span className="text-muted-foreground">
                {group.forCount} pour · {group.againstCount} contre ·{" "}
                {group.abstentionCount} abst.
                {group.nonVotingCount > 0
                  ? ` · ${group.nonVotingCount} non votant${group.nonVotingCount > 1 ? "s" : ""}`
                  : ""}{" "}
                · {absent} absent{absent > 1 ? "s" : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
