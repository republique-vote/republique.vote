// Same colors for a position wherever it is shown: hemicycle seats and result
// bars. Abstention is a choice, so it gets a color of its own rather than the
// grey of members who did not vote
export const VOTE_FILL_CLASSES = {
  for: "fill-[#18753c] dark:fill-[#27a658]",
  against: "fill-[#ce0500] dark:fill-[#ff5655]",
  abstention: "fill-[#b34000] dark:fill-[#fc5d00]",
} as const;

export const VOTE_BG_CLASSES = {
  for: "bg-[#18753c] dark:bg-[#27a658]",
  against: "bg-[#ce0500] dark:bg-[#ff5655]",
  abstention: "bg-[#b34000] dark:bg-[#fc5d00]",
} as const;
