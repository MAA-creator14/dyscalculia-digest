export type DataMode = "practice" | "own";

/**
 * One source of wording/icons for each mode, shared by the switch, the sticky bar and the
 * landing page, so every entry point describes the choice the same way.
 */
export const DATA_MODES: Record<DataMode, { href: string; icon: string; label: string; subLabel: string; bar: string }> = {
  practice: {
    href: "/practice",
    icon: "◇",
    label: "Practice scenario",
    subLabel: "Made-up numbers",
    bar: "Practice — made-up numbers",
  },
  own: {
    href: "/interpret",
    icon: "🔒",
    label: "My own data",
    subLabel: "Stays on this device",
    bar: "Your data — stays on this device",
  },
};
