import CommandCenter from "@/components/CommandCenter";
import JackpotAlert from "@/components/JackpotAlert";
import PrebookingsCard from "@/components/PrebookingsCard";
import NextArrivalsCarousel from "@/components/NextArrivalsCarousel";

const TutkaTab = () => {
  return (
    <div className="px-4 pt-2 pb-6 space-y-6">
      <section aria-label="Suositusalue">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">
          Suositusalue
        </h2>
        <CommandCenter />
        <div className="mt-3">
          <JackpotAlert />
        </div>
      </section>

      <section aria-label="Seuraavat saapujat">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">
          Seuraavat saapujat
        </h2>
        <NextArrivalsCarousel />
      </section>

      <section aria-label="Ennakkotilaukset">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">
          Ennakkotilaukset
        </h2>
        <PrebookingsCard />
      </section>
    </div>
  );
};

export default TutkaTab;