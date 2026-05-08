/**
 * scoring.test.ts
 *
 * Yksikkotestit calculateOpportunityScore-funktiolle.
 *
 * Erityistarkoitus:
 *   - Lukita kaukojuna-regex-bugin korjaus testilla 3 (S-lahijuna ei saa
 *     tuottaa jackpotia)
 *   - Varmistaa immutaabeliuus testissa 11 (input-state ei muutu)
 *   - Varmistaa saakertoimen escalation testissa 8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateOpportunityScore } from "../lib/scoring";
import type {
  DashboardState,
  TrainDelay,
  ShipArrival,
  EventInfo,
  WeatherData,
} from "../lib/types";

// ---------------------------------------------------------------------------
// Mockaa weather.ts - scoring importaa tasta getWeatherMultiplier ja
// getWeatherDescription. Kontrolloimme nama testeissa eksplisiittisesti.
// ---------------------------------------------------------------------------

vi.mock("../lib/weather", () => ({
  getWeatherMultiplier: vi.fn(() => 1.0),
  getWeatherDescription: vi.fn(() => "Sade Helsingissa"),
}));

import { getWeatherMultiplier } from "../lib/weather";

// ---------------------------------------------------------------------------
// Apufunktiot ja oletusarvot
// ---------------------------------------------------------------------------

const CLEAR_WEATHER: WeatherData = {
  condition: "Clear",
  temp: 5,
  rain: 0,
  showers: 0,
  snowfall: 0,
  windSpeed: 2,
  rainModeActive: false,
  slipperyIndex: 0,
};

function makeState(overrides: Partial<DashboardState> = {}): DashboardState {
  return {
    trainDelays: [],
    shipArrivals: [],
    events: [],
    flights: [],
    sportsEvents: [],
    weather: CLEAR_WEATHER,
    ...overrides,
  };
}

function makeTrain(partial: Partial<TrainDelay> = {}): TrainDelay {
  return {
    id: "t1",
    line: "IC 28",
    origin: "Tampere",
    delayMinutes: 35,
    arrivalTime: "12:00",
    ...partial,
  };
}

function makeShip(partial: Partial<ShipArrival> = {}): ShipArrival {
  // ETA 20 min eteenpain nykyhetkesta
  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + 20);
  const etaStr = `${eta.getHours().toString().padStart(2, "0")}:${eta
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  return {
    id: "s1",
    ship: "Tallink Megastar",
    harbor: "Lansiterminaali",
    pax: 2800,
    eta: etaStr,
    ...partial,
  };
}

function makeEvent(partial: Partial<EventInfo> = {}): EventInfo {
  return {
    id: "e1",
    name: "Cara",
    venue: "Hartwall Arena",
    endsIn: 25,
    soldOut: true,
    demandLevel: "red",
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Aikamockaus - ei-yoaika oletuksena (klo 14:00)
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  // Paikallisaika-konstruktori (kuukausi 0-indeksoitu: 4 = toukokuu).
  // isLateNight() kayttaa getHours():ia joka on paikallisajassa.
  vi.setSystemTime(new Date(2026, 4, 8, 14, 0, 0));
  vi.mocked(getWeatherMultiplier).mockReturnValue(1.0);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// 1. Saanto: kaukojunan myohastyminen
// ---------------------------------------------------------------------------

describe("kaukojunasaanto", () => {
  it("1) IC-juna +35 min, ei yoaika -> high Pasilaan", () => {
    const state = makeState({
      trainDelays: [makeTrain({ line: "IC 28", delayMinutes: 35 })],
    });
    const alerts = calculateOpportunityScore(state);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("high");
    expect(alerts[0].zone).toBe("Pasila");
    expect(alerts[0].type).toBe("train");
  });

  it("2) IC-juna +35 min, klo 23:30 -> jackpot Pasila/Rautatientori", () => {
    // Paikallisaika-konstruktori, koska isLateNight kayttaa getHours():ia
    // joka on aikavyohykeherkka. Testiymparisto saattaa olla UTC.
    vi.setSystemTime(new Date(2026, 4, 8, 23, 30, 0));
    const state = makeState({
      trainDelays: [makeTrain({ line: "IC 28", delayMinutes: 35 })],
    });
    const alerts = calculateOpportunityScore(state);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("jackpot");
    expect(alerts[0].zone).toBe("Pasila / Rautatientori");
  });

  it("3) S-lahijuna +60 min ILMAN trainCategory -> EI hallaa (regex-bugin korjaus)", () => {
    // Kriittinen testi: aiempi /^(IC|P|S)\s?\d*/i tuotti tasta jackpotin.
    // Korjattu fallback hyvaksyy vain selvasti yksiselitteisen IC-prefiksin.
    const state = makeState({
      trainDelays: [makeTrain({ line: "S 45", delayMinutes: 60, trainCategory: undefined })],
    });
    const alerts = calculateOpportunityScore(state);
    expect(alerts).toHaveLength(0);
  });

  it("4) S-juna +60 min trainCategory='Long-distance' -> jackpot (Pendolino)", () => {
    // Kun fintraffic.ts paivittaa palauttamaan trainCategory:n,
    // Pendolino tunnistetaan oikein jackpotiksi.
    vi.setSystemTime(new Date(2026, 4, 8, 23, 30, 0)); // Paikallisaika
    const state = makeState({
      trainDelays: [
        makeTrain({ line: "S 45", delayMinutes: 60, trainCategory: "Long-distance" }),
      ],
    });
    const alerts = calculateOpportunityScore(state);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("jackpot");
  });

  it("5) IC-juna +25 min (alle kynnyksen) -> ei hallaa", () => {
    const state = makeState({
      trainDelays: [makeTrain({ line: "IC 28", delayMinutes: 25 })],
    });
    expect(calculateOpportunityScore(state)).toHaveLength(0);
  });

  it("6) Commuter-juna trainCategory='Commuter' +60 min -> ei hallaa", () => {
    // Eksplisiittinen filtteri: vaikka regex ei ehka huomaisi,
    // trainCategory hylkaa selkeasti.
    const state = makeState({
      trainDelays: [
        makeTrain({ line: "K 1234", delayMinutes: 60, trainCategory: "Commuter" }),
      ],
    });
    expect(calculateOpportunityScore(state)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Saanto: laiva saapuu
// ---------------------------------------------------------------------------

describe("laivasaanto", () => {
  it("7) Megastar 2800 hlo ETA +20 min -> jackpot", () => {
    const state = makeState({ shipArrivals: [makeShip({ pax: 2800 })] });
    const alerts = calculateOpportunityScore(state);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("jackpot");
    expect(alerts[0].type).toBe("ship");
    expect(alerts[0].zone).toBe("Lansiterminaali");
  });

  it("8) Pieni laiva 800 hlo ETA +20 min -> ei hallaa", () => {
    const state = makeState({ shipArrivals: [makeShip({ pax: 800 })] });
    expect(calculateOpportunityScore(state)).toHaveLength(0);
  });

  it("9) Keskikokoinen laiva 1500 hlo ETA +35 min -> high", () => {
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + 35);
    const etaStr = `${eta.getHours().toString().padStart(2, "0")}:${eta
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const state = makeState({
      shipArrivals: [makeShip({ pax: 1500, eta: etaStr })],
    });
    const alerts = calculateOpportunityScore(state);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("high");
  });

  it("10) estimatedPax voittaa pax:n pisteytyksessa", () => {
    // Live-estimaatti 2500 nostaa pienemman pax:n yli jackpot-rajan.
    const state = makeState({
      shipArrivals: [makeShip({ pax: 1800, estimatedPax: 2500 })],
    });
    const alerts = calculateOpportunityScore(state);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("jackpot");
  });
});

// ---------------------------------------------------------------------------
// 3. Saanto: liukas keli
// ---------------------------------------------------------------------------

describe("liukasselkasaanto", () => {
  it("11) slipperyIndex 0.7 -> jackpot sairaalat", () => {
    const state = makeState({
      weather: { ...CLEAR_WEATHER, slipperyIndex: 0.7 },
    });
    const alerts = calculateOpportunityScore(state);
    const slipperyAlert = alerts.find((a) => a.type === "weather");
    expect(slipperyAlert).toBeDefined();
    expect(slipperyAlert?.level).toBe("jackpot");
    expect(slipperyAlert?.zone).toContain("Sairaalat");
  });

  it("12) slipperyIndex 0.5 -> ei sairaalahallaa", () => {
    const state = makeState({
      weather: { ...CLEAR_WEATHER, slipperyIndex: 0.5 },
    });
    expect(calculateOpportunityScore(state)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Saakertoimen escalation
// ---------------------------------------------------------------------------

describe("saakerroin-escalation", () => {
  it("13) Sade-multiplier 1.6 nostaa high -> jackpot", () => {
    vi.mocked(getWeatherMultiplier).mockReturnValue(1.6);
    const state = makeState({
      trainDelays: [makeTrain({ line: "IC 28", delayMinutes: 35 })],
      weather: { ...CLEAR_WEATHER, rainModeActive: true, rain: 5.0 },
    });
    const alerts = calculateOpportunityScore(state);
    // IC + sademodus -> molemmat alunperin "high", molemmat nostetaan jackpotiksi
    expect(alerts.every((a) => a.level === "jackpot")).toBe(true);
    // Junalaartin reasonissa pitaa olla saakerroinmaininta
    const trainAlert = alerts.find((a) => a.type === "train");
    expect(trainAlert?.reason).toContain("x1.6 saakerroin");
  });

  it("14) Multiplier 1.2 EI eskaloi", () => {
    vi.mocked(getWeatherMultiplier).mockReturnValue(1.2);
    const state = makeState({
      trainDelays: [makeTrain({ line: "IC 28", delayMinutes: 35 })],
    });
    const alerts = calculateOpportunityScore(state);
    expect(alerts[0].level).toBe("high");
    expect(alerts[0].reason).not.toContain("saakerroin");
  });
});

// ---------------------------------------------------------------------------
// 5. Tapahtumasaanto
// ---------------------------------------------------------------------------

describe("tapahtumasaanto", () => {
  it("15) Red-tason tapahtuma endsIn 25 min -> jackpot purkupiikki", () => {
    const state = makeState({
      events: [makeEvent({ endsIn: 25, demandLevel: "red" })],
    });
    const alerts = calculateOpportunityScore(state);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("jackpot");
    expect(alerts[0].reason).toContain("Purkupiikki");
  });

  it("16) Red-tason loppuunmyyty endsIn 90 min -> high (ei viela purkupiikki)", () => {
    const state = makeState({
      events: [makeEvent({ endsIn: 90, soldOut: true, demandLevel: "red" })],
    });
    const alerts = calculateOpportunityScore(state);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("high");
  });

  it("17) Amber-tason tapahtuma -> ei hallaa", () => {
    const state = makeState({
      events: [makeEvent({ demandLevel: "amber" })],
    });
    expect(calculateOpportunityScore(state)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Immutaabeliuus
// ---------------------------------------------------------------------------

describe("immutaabeliuus", () => {
  it("18) Funktio ei mutatoi input-statea", () => {
    vi.mocked(getWeatherMultiplier).mockReturnValue(1.6);
    const state = makeState({
      trainDelays: [makeTrain({ line: "IC 28", delayMinutes: 35 })],
      weather: { ...CLEAR_WEATHER, rainModeActive: true },
    });
    const stateSnapshot = JSON.stringify(state);
    calculateOpportunityScore(state);
    expect(JSON.stringify(state)).toBe(stateSnapshot);
  });

  it("19) Toistuvat kutsut samalla statella tuottavat ekvivalentin tuloksen", () => {
    const state = makeState({
      trainDelays: [makeTrain({ line: "IC 28", delayMinutes: 35 })],
    });
    const a = calculateOpportunityScore(state);
    const b = calculateOpportunityScore(state);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// 7. Jarjestys
// ---------------------------------------------------------------------------

describe("hallytysjarjestys", () => {
  it("20) Jackpot tulee aina ennen high-hallytyksia", () => {
    vi.setSystemTime(new Date(2026, 4, 8, 23, 30, 0)); // yoaika -> juna jackpotiksi
    const state = makeState({
      trainDelays: [makeTrain({ line: "IC 28", delayMinutes: 40 })],
      shipArrivals: [makeShip({ pax: 1500 })], // -> high
    });
    // Aseta laiva ETA +35 min jotta high-rajaan
    state.shipArrivals = [
      makeShip({
        pax: 1500,
        eta: (() => {
          const e = new Date();
          e.setMinutes(e.getMinutes() + 35);
          return `${e.getHours().toString().padStart(2, "0")}:${e
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
        })(),
      }),
    ];
    const alerts = calculateOpportunityScore(state);
    const jackpotIndex = alerts.findIndex((a) => a.level === "jackpot");
    const highIndex = alerts.findIndex((a) => a.level === "high");
    expect(jackpotIndex).toBeGreaterThanOrEqual(0);
    expect(highIndex).toBeGreaterThan(jackpotIndex);
  });
});
