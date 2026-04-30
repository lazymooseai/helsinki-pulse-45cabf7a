import { forwardRef } from "react";
import { Radar, TrainFront, TrendingUp, Settings } from "lucide-react";

export type TabKey = "tutka" | "liikenne" | "sapina" | "hallinta";

const TABS: { key: TabKey; label: string; icon: typeof Radar }[] = [
  { key: "tutka", label: "Tutka", icon: Radar },
  { key: "liikenne", label: "Liikenne", icon: TrainFront },
  { key: "sapina", label: "Säpinä", icon: TrendingUp },
  { key: "hallinta", label: "Hallinta", icon: Settings },
];

interface Props {
  active: TabKey;
  onChange: (k: TabKey) => void;
}

const BottomNav = forwardRef<HTMLElement, Props>(({ active, onChange }, ref) => {
  return (
    <nav
      ref={ref}
      className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t-2 border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Päänavigointi"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onChange(key)}
                aria-current={isActive ? "page" : undefined}
                className={`relative w-full min-h-[72px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-b-full bg-primary glow-green" />
                )}
                <Icon
                  className={`h-7 w-7 ${isActive ? "drop-shadow-[0_0_6px_hsl(var(--primary))]" : ""}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[11px] font-black uppercase tracking-widest">
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";

export default BottomNav;