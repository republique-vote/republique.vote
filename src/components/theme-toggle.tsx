"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const themes = [
  {
    value: "light",
    label: "Thème clair",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Thème sombre",
    icon: Moon,
  },
  {
    value: "system",
    label: "Système",
    description: "Utilise les paramètres système.",
    icon: Monitor,
  },
] as const;

export function ThemeToggle({
  variant = "header",
}: {
  variant?: "header" | "footer";
}) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={
          variant === "header"
            ? "inline-flex h-8 items-center gap-1.5 rounded-sm px-3 font-medium text-primary text-sm transition-colors hover:bg-accent"
            : "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
        }
        onClick={() => setOpen(true)}
        type="button"
      >
        {variant === "header" && (
          <>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </>
        )}
        Paramètres d&apos;affichage
      </button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Paramètres d&apos;affichage</DialogTitle>
            <DialogDescription>
              Choisissez un thème pour personnaliser l&apos;apparence du site.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-3">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.value;
              return (
                <button
                  className={`flex items-center justify-between rounded-sm border p-4 text-left transition-colors ${
                    isSelected
                      ? "border-2 border-primary bg-accent/30"
                      : "border-border hover:border-primary/50"
                  }`}
                  key={t.value}
                  onClick={() => {
                    setTheme(t.value);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                        isSelected
                          ? "border-[5px] border-primary"
                          : "border-muted-foreground"
                      }`}
                    />
                    <div>
                      <span className="font-medium text-sm">{t.label}</span>
                      {"description" in t && (
                        <p className="mt-0.5 text-muted-foreground text-xs">
                          {t.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Icon
                    className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                  />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
