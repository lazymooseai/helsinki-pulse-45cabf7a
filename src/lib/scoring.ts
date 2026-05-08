/**
 * scoring.ts
 *
 * TaxiCEO-pisteytysmalli: laskee JackpotAlert-listat kaikista signaalilahteista.
 *
 * Prioriteettijarjestys:
 *   1. Jackpot-alertit (tason nosto saakerroimella)
 *   2. High-alertit
 *   3. Tapahtumat (red > amber > green)
 *
 * Liukkausindeksi >= 0.6 tuottaa erillisen sairaala-signaalin.
 *
 * Muutoshistoria:
 * - BUG-FIX: isLongDistance ottaa nyt koko TrainDelay-objektin ja kayttaa
 *   trainCategory-kenttaa kun se on saatavilla. Aiempi regex hyvaksyi
 *   prefiksit IC, P ja S, mutta tuotti vaaria positiivisia: S-juna on
 *   Helsingin lahijuna, ja P voi olla seka Pendolino etta P-lahijuna.
 * - BUG-FIX: Saakertoimen nosto high -> jackpot luo nyt uusia alert-objekteja
 *   .map():lla. Aiempi mutaatio rikkoi React-immutability-periaatetta ja saattoi
 *   aiheuttaa stale-render-bugeja jos useMemo-referenssi pysyi samana.
 */

import { DashboardState, JackpotAlert, TrainDelay } from "./types";
import { getWeatherMultiplier, getWeatherDescription } from "./weather";

// ---------------------------------------------------------------------------
// Konfiguroitavat kynnysarvot
// ---------------------------------------------------------------------------
// Keskitetty tahan jotta tuotantoasetukset on helppo viritella ilman
// scoring-logiikan kaivelua. Siirrettavissa myohemmin lib/config.ts:aan.

const TRAIN_DELAY_THRESHOLD_MIN = 30;        // Yli taman = hairio Pasilassa
const SHIP_PAX_JACKPOT_THRESHOLD = 2000;     // Yli taman = jackpot
const SHIP_PAX_HIGH_THRESHOLD = 1000;        // Yli taman = high alert
const SHIP_ETA_JACKPOT_WINDOW_MIN = 30;      // Lahestyy alle taman = jackpot
const SHIP_ETA_HIGH_WINDOW_MIN = 45;         // Lahestyy alle taman = high
const SLIPPERY_HOSPITAL_THRESHOLD = 0.6;     // Indeksi taman ylittyessa = sairaalat
const WEATHER_ESCALATION_MULTIPLIER = 1.5;   // Tata suuremmilla saakertoimilla high -> jackpot
const EVENT_PURKUHETKI_WINDOW_MIN = 30;      // Tapahtuman paatto-ikkuna = purkupiikki
const EVENT_LOOKAHEAD_LIMIT_MIN = 120;       // Yli taman: tapahtuma ei viela kuuma
const LATE_NIGHT_START_HOUR = 22;
const LATE_NIGHT_END_HOUR = 5;

// ---------------------------------------------------------------------------
// Apufunktiot
// ---------------------------------------------------------------------------

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

function minutesUntil(eta: string): number {
  const now = new Date();
  const { hours, minutes } = parseTime(eta);
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target < now) target.setDate(target.getDate() + 1);
  return Math.round((target.getTime() - now.getTime()) / 60000);
}

/**
 * Tarkistaa onko juna kaukojuna.
 *
 * Suosii eksplisiittista trainCategory-kenttaa Digitraffic-API:sta.
 * Mikali kentta puuttuu (vanha data tai fintraffic.ts ei viela populoi sita),
 * fallback hyvaksyy vain selvasti yksiselitteisen IC-prefiksin.
 *
 * HUOM: Fallback jattaa Pendolinon ja muut kaukojunatyypit ulkopuolelle
 * tarkoituksellisesti. Vaarat positiiviset (esim. P-lahijuna paasi lapi
 * jackpot-hetkeksi) ovat haitallisempia kuin vaarat negatiiviset.
 *
 * KORJAA: Paivita src/lib/fintraffic.ts populoimaan trainCategory-kentta
 * jokaiseen palautettuun TrainDelay-objektiin, niin kaikki kaukojunatyypit
 * tunnistetaan oikein.
 */
function isLongDistance(train: TrainDelay): boolean {
  if (train.trainCategory) {
    return train.trainCategory === "Long-distance";
  }
  // Konservatiivinen fallback: vain IC + numero (esim. "IC 28")
  return /^IC\s?\d+$/i.test(train.line.trim());
}

function isLateNight(): boolean {
  const h = new Date().getHours();
  return h >= LATE_NIGHT_START_HOUR || h < LATE_NIGHT_END_HOUR;
}

// ---------------------------------------------------------------------------
// Paapisteytys
// ---------------------------------------------------------------------------

/**
 * Laskee kaikki mahdolliset JackpotAlert-ilmoitukset nykyisesta tilasta.
 *
 * Saannot tarkistujarjestyksessa:
 *   1. VR kaukojuna myohassa > 30 min
 *   2. Suuri laiva saapuu < 30 min (pax > 2000)
 *   3. Liukas keli (slipperyIndex >= 0.6)
 *   4. Kova sade/myrsky
 *   5. Tapahtuma red-tasolla (loppuunmyyty/korkea kysynta)
 *   6. Saakertoimen nosto high -> jackpot
 *
 * Funktio on puhdas: ei sivuvaikutuksia, ei mutaatioita, sama input -> sama output.
 */
export function calculateOpportunityScore(state: DashboardState): JackpotAlert[] {
  const alerts: JackpotAlert[] = [];
  const weatherMultiplier = getWeatherMultiplier(state.weather);

  // -- Saailisays tekstiin --
  function wtag(): string {
    if (state.weather.rainModeActive) return " + Sademodus";
    if (state.weather.snowfall > 0.1) return " + Lumisade";
    if (
      state.weather.slipperyIndex !== undefined &&
      state.weather.slipperyIndex >= SLIPPERY_HOSPITAL_THRESHOLD
    ) {
      return " + Liukas keli";
    }
    return "";
  }

  // ------------------------------------------------------------------
  // Saanto 1: VR kaukojuna myohassa > 30 min
  // ------------------------------------------------------------------
  for (const train of state.trainDelays) {
    if (!isLongDistance(train) || train.delayMinutes <= TRAIN_DELAY_THRESHOLD_MIN) {
      continue;
    }

    if (isLateNight()) {
      alerts.push({
        level: "jackpot",
        zone: "Pasila / Rautatientori",
        reason: `${train.line} (${train.origin}) +${train.delayMinutes} min myohassa. Pasila tayteen.${wtag()}`,
        type: "train",
      });
    } else {
      alerts.push({
        level: "high",
        zone: "Pasila",
        reason: `${train.line} (${train.origin}) myohassa +${train.delayMinutes} min.${wtag()}`,
        type: "train",
      });
    }
  }

  // ------------------------------------------------------------------
  // Saanto 2: Suuri laiva saapuu pian
  // ------------------------------------------------------------------
  for (const ship of state.shipArrivals) {
    const minsUntil = minutesUntil(ship.eta);
    const effectivePax = ship.estimatedPax ?? ship.pax;

    if (
      effectivePax > SHIP_PAX_JACKPOT_THRESHOLD &&
      minsUntil >= 0 &&
      minsUntil <= SHIP_ETA_JACKPOT_WINDOW_MIN
    ) {
      alerts.push({
        level: "jackpot",
        zone: ship.harbor,
        reason: `${ship.ship} (~${effectivePax.toLocaleString()} hlo) saapuu ${minsUntil} min paasta.${wtag()}`,
        type: "ship",
      });
    } else if (
      effectivePax > SHIP_PAX_HIGH_THRESHOLD &&
      minsUntil >= 0 &&
      minsUntil <= SHIP_ETA_HIGH_WINDOW_MIN
    ) {
      alerts.push({
        level: "high",
        zone: ship.harbor,
        reason: `${ship.ship} (~${effectivePax.toLocaleString()} hlo) saapumassa.${wtag()}`,
        type: "ship",
      });
    }
  }

  // ------------------------------------------------------------------
  // Saanto 3: Liukas keli -> sairaala-signaali
  // ------------------------------------------------------------------
  if (
    state.weather.slipperyIndex !== undefined &&
    state.weather.slipperyIndex >= SLIPPERY_HOSPITAL_THRESHOLD
  ) {
    alerts.push({
      level: "jackpot",
      zone: "Sairaalat (Meilahti / Jorvi / Peijas)",
      reason: `Liukas keli - indeksi ${state.weather.slipperyIndex.toFixed(1)}. Kaatumiset lisaantyvat. Sairaalat kuumia.`,
      type: "weather",
    });
  }

  // ------------------------------------------------------------------
  // Saanto 4: Kova sade tai myrsky
  // ------------------------------------------------------------------
  if (state.weather.rainModeActive && weatherMultiplier >= WEATHER_ESCALATION_MULTIPLIER) {
    alerts.push({
      level: "high",
      zone: "Koko Helsinki",
      reason: getWeatherDescription(state.weather),
      type: "weather",
    });
  }

  // ------------------------------------------------------------------
  // Saanto 5: Tapahtumat red-tasolla
  // ------------------------------------------------------------------
  for (const event of state.events) {
    if (event.demandLevel !== "red") continue;
    if (event.endsIn > EVENT_LOOKAHEAD_LIMIT_MIN) continue; // Ei viela alkamassa

    const minsUntilEnd = event.endsIn;
    const isPurkuhetki =
      minsUntilEnd <= EVENT_PURKUHETKI_WINDOW_MIN && minsUntilEnd >= 0;

    if (isPurkuhetki) {
      alerts.push({
        level: "jackpot",
        zone: event.venue,
        reason: `${event.name} paattyy ${minsUntilEnd} min paasta. Purkupiikki alkaa!`,
        type: "event",
      });
    } else if (event.soldOut) {
      alerts.push({
        level: "high",
        zone: event.venue,
        reason: `${event.name} - ${event.demandTag ?? "Korkea kysynta"}`,
        type: "event",
      });
    }
  }

  // ------------------------------------------------------------------
  // Saakertoimen nosto: high -> jackpot kun saakerroin >= 1.5
  // (Immutaabeli: luodaan uusia objekteja sen sijaan etta mutatoitaisiin)
  // ------------------------------------------------------------------
  const escalated: JackpotAlert[] =
    weatherMultiplier >= WEATHER_ESCALATION_MULTIPLIER
      ? alerts.map((a) =>
          a.level === "high"
            ? {
                ...a,
                level: "jackpot" as const,
                reason: `${a.reason} (x${weatherMultiplier} saakerroin)`,
              }
            : a,
        )
      : alerts;

  // ------------------------------------------------------------------
  // Jarjesta: jackpot ensin, sitten high
  // (Toinen kopio jotta map-tulosta ei mutatoida)
  // ------------------------------------------------------------------
  return [...escalated].sort((a, b) => {
    if (a.level === b.level) return 0;
    return a.level === "jackpot" ? -1 : 1;
  });
}
