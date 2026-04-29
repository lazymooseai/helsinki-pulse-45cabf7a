import { useState } from "react";
import ArrivalsList, { TransportMode } from "@/components/ArrivalsList";
import { useDashboard } from "@/context/DashboardContext";
import { TRAIN_STATIONS, type TrainStation } from "@/lib/fintraffic";

const FILTERS: { key: TransportMode; label: string }[] = [
  { key: "trains", label: "Junat" },
  { key: "ships", label: "Laivat" },
  { key: "flights", label: "Lennot" },
];

const LiikenneTab = () => {
  const [mode, setMode] = useState<TransportMode>("trains");
  const { trainStation, setTrainStation } = useDashboard();

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => {
            const active = mode === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setMode(f.key)}
                aria-pressed={active}
                className={`shrink-0 h-12 px-6 rounded-full font-black uppercase tracking-wider text-sm transition-all active:scale-95 ${
                  active
                    ? "bg-primary text-primary-foreground glow-green"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {mode === "trains" && (
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
            {TRAIN_STATIONS.map((s) => {
              const active = trainStation === s.code;
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => setTrainStation(s.code as TrainStation)}
                  aria-pressed={active}
                  className={`shrink-0 h-11 px-5 rounded-lg font-black text-sm transition-all active:scale-95 flex items-center gap-2 ${
                    active
                      ? "bg-accent text-accent-foreground border-2 border-accent"
                      : "bg-muted text-muted-foreground border-2 border-border"
                  }`}
                >
                  <span className="font-mono text-xs opacity-70">{s.code}</span>
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        <ArrivalsList mode={mode} />
      </div>
    </div>
  );
};

export default LiikenneTab;