# Project Memory

## Core
- High-contrast UI: bg-slate-900, massive text (4xl/5xl font-black), levollinen turkoosi-sininen --primary (188 72% 50%) korvaa aiemman neonvihreän. Finnish text. Optimize for arm's length driving (html base 18-19 px).
- All interactive cards and control room items must open verified external deep links in new tabs. Linkit on tarkistettava (curl -I) ennen lisäystä.
- Use Supabase Edge Functions to proxy external APIs (Fintraffic, Open-Meteo, HSL, Finavia) to bypass CORS.
- Data freshness: display 'LIVE' dot for recent, gray 'AIKATAULU' dot for stale (>30m). Pulse external link icon when stale.
- HKT tolppa = 18 (Eläintarhantie). HKT-tapahtumiin näyttämömerkintä subtitleen (Suuri/Arena/Studio Pasila/Pieni).
- Lentojen lähtöpaikan nimi (origin) ei saa truncatea — käytä break-words.

## Memories
- [Visual Identity](mem://design/visual-identity) — High-contrast, ultra-legible dashboard UI for drivers (Finnish)
- [Jackpot Engine](mem://logic/jackpot-engine) — Logic for triggering high-value alerts based on delays, pax, and weather
- [Helsinki Live Data](mem://integrations/helsinki-live-data) — API integration rules for Fintraffic, Open-Meteo, MyHelsinki, and HSL
- [Recommendation System](mem://features/recommendation-system) — Command Center zone recommendation and driver feedback loop
- [Harbor Tracking](mem://features/harbor-tracking) — Helsinki ferry passenger tracking via averio.fi
- [Events Tracking](mem://features/events-tracking) — Helsinki events fetching, fallback events, and demand heuristics
- [Manual Overrides](mem://features/manual-overrides) — Driver manual event data overrides (Crowd Control, Dispatch Override)
- [Control Room Sources](mem://features/control-room-sources) — Master Data Library linking to verified external schedules and maps
- [Situational Awareness](mem://features/situational-awareness) — HSL alerts, traffic cameras, and emergency links
- [Interactive Data Cards](mem://features/interactive-data-cards) — Interactive links and freshness indicators on all data cards
- [Train Station Selector](mem://features/train-station-selector) — Toggles between HKI, PSL, TKL stations, filtered for HKI-bound traffic
- [Prebookings](mem://features/prebookings) — Ennakkotilausten syotto + heatmap + halytys
- [Dispatch Scanner](mem://features/dispatch-scanner) — Camera + AI-OCR for Taksi Helsinki dispatch screen
- [Trip History](mem://features/trip-history) — taxi_trips & trip_patterns
- [Real-Time Refresh](mem://features/real-time-refresh) — Per-source refresh intervals and visible countdown
- [Flights & Sports](mem://features/flights-sports) — HEL-Vantaa flight arrivals + sports events
