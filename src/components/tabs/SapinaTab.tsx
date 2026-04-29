import EventsTimeline from "@/components/EventsTimeline";
import DispatchLiveCard from "@/components/DispatchLiveCard";

const SapinaTab = () => {
  return (
    <div className="px-4 pt-2 pb-6 space-y-6">
      <section aria-label="Tapahtumat">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">
          Tapahtumat
        </h2>
        <EventsTimeline />
      </section>

      <section aria-label="Kysyntäennuste">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">
          Kysyntä tolpilla & Top alueet
        </h2>
        <DispatchLiveCard />
      </section>
    </div>
  );
};

export default SapinaTab;