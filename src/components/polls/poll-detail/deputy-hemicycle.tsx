"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type Position = "for" | "against" | "abstention" | "nonVoting";

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
  position: Position;
}

type SeatPosition = Position | "absent";

interface Seat {
  groupName: string;
  label: string;
  position: SeatPosition;
  voterId: string | null;
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

const POSITION_CLASSES: Record<SeatPosition, string> = {
  for: "fill-[#18753c] dark:fill-[#27a658]",
  against: "fill-[#ce0500] dark:fill-[#ff5655]",
  abstention: "fill-[#b34000] dark:fill-[#fc5d00]",
  nonVoting: "fill-muted-foreground",
  absent: "fill-muted stroke-border",
};

const ROWS = 16;
const INNER_RADIUS = 90;
const OUTER_RADIUS = 300;

// Math.sin and Math.cos can differ in the last digits between the server and
// the browser, which breaks hydration: keep two decimals
function round(value: number) {
  return Math.round(value * 100) / 100;
}

// Parliament chart: rows of seats on concentric half circles, each row holding
// seats in proportion to its length, then every seat sorted from left to right
function layoutSeats(total: number) {
  const radii = Array.from(
    { length: ROWS },
    (_, i) => INNER_RADIUS + (i * (OUTER_RADIUS - INNER_RADIUS)) / (ROWS - 1)
  );
  const radiusSum = radii.reduce((a, b) => a + b, 0);
  const perRow = radii.map((r) => Math.round((total * r) / radiusSum));
  perRow[ROWS - 1] += total - perRow.reduce((a, b) => a + b, 0);

  const seats = radii.flatMap((radius, row) =>
    Array.from({ length: perRow[row] }, (_, i) => {
      const angle = Math.PI * (1 - i / Math.max(perRow[row] - 1, 1));
      return {
        angle,
        x: round(OUTER_RADIUS + radius * Math.cos(angle)),
        y: round(OUTER_RADIUS - radius * Math.sin(angle)),
      };
    })
  );
  // Proportional rows give every row the same distance between seats
  const spacing = Math.min(
    (Math.PI * radiusSum) / Math.max(total, 1),
    (OUTER_RADIUS - INNER_RADIUS) / (ROWS - 1)
  );
  return { seats: seats.sort((a, b) => b.angle - a.angle), spacing };
}

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

  const seats = useMemo(() => {
    const occupants = ordered.flatMap((group) => {
      const members = votes
        .filter((v) => v.groupRef === group.groupRef)
        .map((v) => ({
          position: v.position as SeatPosition,
          voterId: v.id,
          label: fullName(v),
        }));
      const absent = Math.max(group.members - members.length, 0);
      return [
        ...members,
        ...Array.from({ length: absent }, () => ({
          position: "absent" as const,
          voterId: null,
          label: "Absent",
        })),
      ]
        .sort(
          (a, b) =>
            POSITION_ORDER.indexOf(a.position) -
            POSITION_ORDER.indexOf(b.position)
        )
        .map((occupant) => ({ ...occupant, groupName: group.name }));
    });
    const layout = layoutSeats(occupants.length);
    return {
      list: occupants.map(
        (occupant, i): Seat => ({ ...occupant, ...layout.seats[i] })
      ),
      spacing: layout.spacing,
    };
  }, [ordered, votes]);

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
  // Leaves a visible gap between neighbouring seats
  const seatRadius = round(seats.spacing * 0.4);
  const viewBox = {
    x: -seatRadius - 1,
    y: -seatRadius - 1,
    width: OUTER_RADIUS * 2 + seatRadius * 2 + 2,
    height: OUTER_RADIUS + seatRadius * 2 + 2,
  };
  const activeSeat = active === null ? null : seats.list[active];

  return (
    <section className="mt-6 space-y-4 border border-border p-4">
      <h2 className="font-medium text-sm">Comment ont voté les députés</h2>

      <div className="relative">
        <svg
          aria-label="Hémicycle : vote de chaque député, groupes placés de gauche à droite comme dans l'Assemblée"
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
          {seats.list.map((seat, i) => (
            <circle
              className={`${POSITION_CLASSES[seat.position]} ${
                highlighted.size > 0 &&
                !(seat.voterId && highlighted.has(seat.voterId))
                  ? "opacity-20"
                  : ""
              } ${active === i ? "stroke-foreground" : ""}`}
              cx={seat.x}
              cy={seat.y}
              data-seat={i}
              // biome-ignore lint/suspicious/noArrayIndexKey: seats have no identity beyond their place
              key={i}
              r={seatRadius}
              strokeWidth={seatStroke(seat, active === i)}
            />
          ))}
        </svg>
        {activeSeat ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-border bg-popover px-2.5 py-1.5 text-popover-foreground text-xs shadow-md"
            style={{
              left: `${((activeSeat.x - viewBox.x) / viewBox.width) * 100}%`,
              top: `calc(${((activeSeat.y - viewBox.y) / viewBox.height) * 100}% - ${seatRadius + 4}px)`,
            }}
          >
            <p className="font-medium">{activeSeat.label}</p>
            <p className="text-muted-foreground">
              {activeSeat.groupName} · {POSITION_LABELS[activeSeat.position]}
            </p>
          </div>
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
            {" a voté "}
            <span className="font-medium">
              {POSITION_LABELS[m.position].toLowerCase()}
            </span>
          </p>
        ))}
        {normalizedQuery.length >= 2 && matches.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun député de ce nom n'a pris part au vote.
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
