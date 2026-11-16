"use client";

import { DeputyAvatar } from "@/components/polls/poll-detail/deputy-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { deputyPhotoUrl } from "@/services/assembly/photo";

export interface PollAuthorData {
  firstName: string;
  groupAbbrev: string | null;
  groupColor: string | null;
  groupName: string | null;
  id: string;
  lastName: string;
  photoLegislature: string | null;
  role: "author" | "cosignatory";
}

// Faces shown in the stack before the "+N" counter
const STACK_SIZE = 16;
// Up to this many cosignatories, list them by name instead of a face stack
const NAMED_LIST_MAX = 4;

// French convention: last name in capitals
function fullName(person: PollAuthorData) {
  return `${person.firstName} ${person.lastName.toUpperCase()}`;
}

function GroupLabel({ person }: { person: PollAuthorData }) {
  if (!person.groupName) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: person.groupColor ?? "currentColor" }}
      />
      {person.groupName}
    </span>
  );
}

export function PollAuthors({ authors }: { authors: PollAuthorData[] }) {
  const leads = authors.filter((a) => a.role === "author");
  const cosignatories = authors.filter((a) => a.role === "cosignatory");

  if (authors.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 border border-border p-4">
      <div className="space-y-3">
        <h2 className="font-medium text-sm">Proposé par</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {leads.map((person) => (
            <PersonRow key={person.id} person={person} size={44} />
          ))}
        </div>
      </div>

      {cosignatories.length > 0 ? (
        <div className="space-y-3 border-border border-t pt-4">
          <h2 className="font-medium text-sm">
            Cosigné par {cosignatories.length}{" "}
            {cosignatories.length > 1 ? "personnes" : "personne"}
          </h2>
          {cosignatories.length <= NAMED_LIST_MAX ? (
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {cosignatories.map((person) => (
                <PersonRow key={person.id} person={person} size={36} />
              ))}
            </div>
          ) : (
            <CosignatoryStack cosignatories={cosignatories} />
          )}
        </div>
      ) : null}
    </section>
  );
}

function PersonRow({ person, size }: { person: PollAuthorData; size: number }) {
  return (
    <div className="flex items-center gap-3">
      <DeputyAvatar
        name={fullName(person)}
        photoUrl={deputyPhotoUrl(person.id, person.photoLegislature)}
        size={size}
      />
      <div className="flex flex-col">
        <span className="font-medium">{fullName(person)}</span>
        <GroupLabel person={person} />
      </div>
    </div>
  );
}

function CosignatoryStack({
  cosignatories,
}: {
  cosignatories: PollAuthorData[];
}) {
  return (
    <>
      <div className="flex flex-wrap items-center">
        {cosignatories.slice(0, STACK_SIZE).map((person) => (
          <Tooltip key={person.id}>
            <TooltipTrigger asChild>
              <span className="-ml-2 rounded-full ring-2 ring-background first:ml-0">
                <DeputyAvatar
                  name={fullName(person)}
                  photoUrl={deputyPhotoUrl(person.id, person.photoLegislature)}
                  size={32}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {fullName(person)}
                {person.groupName ? ` · ${person.groupName}` : ""}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        {cosignatories.length > STACK_SIZE ? (
          <span className="-ml-2 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-muted px-2 font-medium text-muted-foreground text-xs ring-2 ring-background">
            +{cosignatories.length - STACK_SIZE}
          </span>
        ) : null}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">
          Voir les {cosignatories.length} cosignataires
        </summary>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {cosignatories.map((person) => (
            <li className="flex items-center gap-2" key={person.id}>
              <DeputyAvatar
                name={fullName(person)}
                photoUrl={deputyPhotoUrl(person.id, person.photoLegislature)}
                size={28}
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate">{fullName(person)}</span>
                <GroupLabel person={person} />
              </div>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
