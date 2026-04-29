import { TrainFront, Ship, Plane, Users } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { TRAIN_STATIONS } from "@/lib/fintraffic";

export type TransportMode = "trains" | "ships" | "flights";

interface RowProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
  time: string;
  delay?: number;
  pax?: number;
  status?: string;
  paxProminent?: boolean;
}

const Row = ({ icon, title, sub, time, delay = 0, pax, status, paxProminent }: RowProps) => {
  const delayed = delay > 5;
  const slight = delay > 0 && !delayed;
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 border-l-4 ${
        delayed ? "border-l-destructive" : slight ? "border-l-accent" : "border-l-primary"
      }`}
    >
      <div
        className={`shrink-0 ${
          delayed ? "text-destructive" : slight ? "text-accent" : "text-primary"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-xl text-foreground truncate">{title}</p>
        <p className="text-sm text-muted-foreground font-bold truncate">{sub}</p>
        {paxProminent && pax !== undefined && pax > 0 ? (
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-2 py-1 text-primary">
            <Users className="h-4 w-4" />
            <span className="font-black text-base tabular-nums">
              {pax.toLocaleString("fi-FI")}
            </span>
            <span className="text-xs font-bold uppercase opacity-80">hlö</span>
          </div>
        ) : (pax !== undefined && pax > 0) || status ? (
          <p className="text-xs text-muted-foreground/80 mt-0.5">
            {pax !== undefined && pax > 0 && <>{pax.toLocaleString("fi-FI")} hlö</>}
            {pax !== undefined && pax > 0 && status ? " · " : ""}
            {status}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span
          className={`font-mono font-black text-3xl ${
            delayed ? "text-destructive" : slight ? "text-accent" : "text-primary"
          }`}
        >
          {time}
        </span>
        {delay > 0 && (
          <span
            className={`text-xs font-black ${
              delayed ? "text-destructive" : "text-accent"
            }`}
          >
            +{delay} min
          </span>
        )}
        {delay === 0 && (
          <span className="text-xs font-black text-primary uppercase">Ajoissa</span>
        )}
      </div>
    </div>
  );
};

const ArrivalsList = ({ mode }: { mode: TransportMode }) => {
  const { state, trainStation } = useDashboard();

  if (mode === "trains") {
    const stationName =
      TRAIN_STATIONS.find((s) => s.code === trainStation)?.name ?? trainStation;
    if (state.trainDelays.length === 0) {
      return <Empty label={`Ei tulevia junia – ${stationName}`} />;
    }
    return (
      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
          Saapuvat → {stationName}
        </p>
        {state.trainDelays.map((t) => (
          <Row
            key={t.id}
            icon={<TrainFront className="h-7 w-7" />}
            title={t.line}
            sub={`${t.origin} → ${stationName}`}
            time={t.arrivalTime}
            delay={t.delayMinutes}
            pax={t.capacity}
          />
        ))}
      </div>
    );
  }

  if (mode === "ships") {
    if (state.shipArrivals.length === 0) {
      return <Empty label="Ei tulevia laivoja" />;
    }
    return (
      <div className="space-y-3">
        {state.shipArrivals.map((s) => (
          <Row
            key={s.id}
            icon={<Ship className="h-7 w-7" />}
            title={s.ship}
            sub={s.harbor}
            time={s.eta}
            pax={s.estimatedPax ?? s.pax}
            paxProminent
          />
        ))}
      </div>
    );
  }

  if (state.flights.length === 0) {
    return <Empty label="Ei tulevia lentoja" />;
  }
  return (
    <div className="space-y-3">
      {state.flights.map((f) => (
        <Row
          key={f.id}
          icon={<Plane className="h-7 w-7" />}
          title={f.flightNumber}
          sub={f.origin}
          time={f.estimatedTime}
          delay={f.delayMinutes}
          status={f.status}
        />
      ))}
    </div>
  );
};

const Empty = ({ label }: { label: string }) => (
  <div className="rounded-xl border border-border bg-card px-5 py-10 text-center text-muted-foreground font-bold">
    {label}
  </div>
);

export default ArrivalsList;