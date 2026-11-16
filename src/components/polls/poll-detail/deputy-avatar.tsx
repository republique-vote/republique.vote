"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Official photo when the Assemblée has one, initials otherwise
export function DeputyAvatar({
  name,
  photoUrl,
  size,
  className,
}: {
  name: string;
  photoUrl: string | null;
  size: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!photoUrl || failed) {
    return (
      <span
        aria-label={name}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs",
          className
        )}
        role="img"
        style={{ width: size, height: size }}
      >
        {initials}
      </span>
    );
  }

  return (
    <Image
      alt={name}
      className={cn(
        "shrink-0 rounded-full bg-muted object-cover object-top",
        className
      )}
      height={size}
      onError={() => setFailed(true)}
      src={photoUrl}
      // Global img styles change the height: pin both dimensions
      style={{ width: size, height: size }}
      width={size}
    />
  );
}
