/**
 * SuggestionButton.tsx
 *
 * Pieni "Ehdota parannusta" -nappi, jonka voi liittää mihin tahansa korttiin
 * tai osioon. Avaa lomakkeen, jossa kuljettaja voi kirjoittaa kehitysehdotuksen
 * tai bugiraportin. Tallennetaan public.feature_feedback -tauluun.
 *
 * Käyttö:
 *   <SuggestionButton feature="Tutka / Suositusalue" />
 *   <SuggestionButton feature="Liikenne / Lennot" variant="inline" />
 */

import { useState } from "react";
import { Lightbulb, Send, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type Variant = "inline" | "floating" | "icon";

interface Props {
  feature: string;
  context?: string;
  variant?: Variant;
}

const RATINGS: Array<{ value: string; label: string }> = [
  { value: "bug", label: "Virhe / Bugi" },
  { value: "improvement", label: "Parannusehdotus" },
  { value: "idea", label: "Uusi idea" },
  { value: "praise", label: "Tämä toimii hyvin" },
];

const SuggestionButton = ({ feature, context, variant = "inline" }: Props) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<string>("improvement");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      toast("Kirjoita lyhyt kuvaus", { description: "Vähintään 3 merkkiä." });
      return;
    }
    setSending(true);
    try {
      const { error } = await (supabase.from as any)("feature_feedback").insert({
        feature,
        context: context ?? null,
        message: trimmed,
        rating,
        user_agent: navigator.userAgent.slice(0, 200),
      });
      if (error) throw error;
      toast("Kiitos palautteesta!", { description: "Ehdotus on tallennettu kehitystiimille." });
      setMessage("");
      setOpen(false);
    } catch (err) {
      console.warn("Suggestion submit failed:", err);
      toast("Tallennus epäonnistui", { description: "Yritä hetken päästä uudelleen." });
    } finally {
      setSending(false);
    }
  };

  const trigger = (() => {
    if (variant === "icon") {
      return (
        <button
          aria-label={`Ehdota parannusta: ${feature}`}
          title="Ehdota parannusta"
          className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center active:scale-95 transition-all"
        >
          <Lightbulb className="h-5 w-5 text-primary" />
        </button>
      );
    }
    if (variant === "floating") {
      return (
        <button
          aria-label="Ehdota parannusta"
          title="Ehdota parannusta"
          className="fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-all"
        >
          <Lightbulb className="h-6 w-6" />
        </button>
      );
    }
    return (
      <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/50 active:scale-[0.97] transition-all">
        <Lightbulb className="h-3.5 w-3.5" />
        Ehdota
      </button>
    );
  })();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-black uppercase tracking-wide flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            Kehitysehdotus
          </SheetTitle>
          <SheetDescription className="text-base">
            Toiminto: <strong className="text-primary">{feature}</strong>
            {context && <span className="block text-sm text-muted-foreground mt-1">{context}</span>}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4 pb-8">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Tyyppi
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRating(r.value)}
                  className={`rounded-lg border-2 px-3 py-2 text-sm font-bold transition-all active:scale-[0.98] ${
                    rating === r.value
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Mitä havaitsit / mitä toivoisit?
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Kerro lyhyesti mitä parannettavaa, mikä ei toimi tai mitä uutta toivoisit. Konkreettiset esimerkit auttavat eniten."
              className="min-h-[140px] text-base"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-card py-3 font-bold text-sm text-muted-foreground active:scale-[0.98] transition-all"
            >
              <X className="h-5 w-5" />
              Peruuta
            </button>
            <button
              onClick={submit}
              disabled={sending || message.trim().length < 3}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/15 text-primary py-3 font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
              {sending ? "Lähetetään…" : "Lähetä"}
            </button>
          </div>

          <p className="text-xs text-muted-foreground/70 leading-relaxed pt-2">
            Palaute tallennetaan turvalliseen tietokantaan ja luetaan kehitystiimin
            toimesta. Älä kirjoita henkilötietoja tai salasanoja. Jos haluat
            antaa palautetta yleisesti, valitse <em>Hallinta</em>-välilehdeltä
            yleinen palautelomake.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SuggestionButton;