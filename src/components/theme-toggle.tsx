"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

export function ThemeToggle({ variant = "header" }: { variant?: "header" | "footer" }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={variant === "header"
          ? "inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-primary hover:bg-accent rounded-sm transition-colors"
          : "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded-sm transition-colors"
        }
      >
        {variant === "header" && (
          <>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </>
        )}
        Paramètres d&apos;affichage
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Paramètres d&apos;affichage</DialogTitle>
            <DialogDescription>
              Choisissez un thème pour personnaliser l&apos;apparence du site.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => {
                    setTheme(t.value);
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between p-4 rounded-sm border transition-colors text-left ${
                    isSelected
                      ? "border-primary border-2 bg-accent/30"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                      isSelected ? "border-primary border-[5px]" : "border-muted-foreground"
                    }`} />
                    <div>
                      <span className="font-medium text-sm">{t.label}</span>
                      {"description" in t && (
                        <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                      )}
                    </div>
                  </div>
                  <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
