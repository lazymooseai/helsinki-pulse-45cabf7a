---
name: Venue → Tolppa mapping
description: Tapahtumat ja venuet linkitetään lähimpään taksitolppaan override+geo+token-haulla
type: feature
---

## Logiikka (`src/lib/tolppaLocations.ts`)

`findTolppaForVenue(venue)` etsii sopivimman tolpan järjestyksessä:
1. **Override-mappi** (`VENUE_TOLPPA_OVERRIDES`) — kovakoodatut erikoistapaukset, esim:
   - Säätytalo / Smolna / VN-linna → Aleksanterinkatu (tolppa 6)
   - Kansallisooppera → Ooppera (tolppa 52, Itä-Töölö)
   - Savoy / Hotel St. George → Erottaja (yhdistetty 21+4 Kämp)
   - Suomalainen Klubi → Kasarmikatu (tolppa 96)
   - Veikkaus Arena / Olympiastadion → Töölöntori
2. **Geo-fallback** (`VENUE_GEO`) — tunnetuille venueille tallennetut koordinaatit
   → `findNearestTolppa(lat, lon)` etsii lähimmän TOLPAT-listalta haversinella.
3. **Token-haku** (`findTolppaSmart`) — etsii tolpan nimeä venue-stringistä.

## TolppaLocation -kenttiä
- `number`, `number2` — viralliset Taksi Helsingin tolppanumerot (Erottaja+Kämp = 21+4)
- `street` — lyhyt katuosoite näyttöä varten

`formatTolppaLabel(t)` → "Tolppa 6 — Aleksanterinkatu" tai "Tolppa 21/4 — Erottaja".

## Aikajananäyttö (`EventsTimeline`)
- Jokaiselle event/sports/political TimelineItemille tallennetaan `tolppa`.
- `withTolppaDistances(items, userLat, userLon)` lisää `tolppaKmFromUser`.
- Kortin alareunassa näytetään 📍 "Tolppa N — Nimi • X.X km" jos GPS päällä.
- Lähellä-suodatin (5 km) toggle näyttää vain käyttäjän lähellä olevat.
- Lähemmät saavat painotusbonuksen (max +30) sortauksessa.

## Lähteet
- Tolppanumerot perustuvat Taksi Helsingin tunnettuihin numeroihin (käyttäjän
  vahvistamat: 6 Aleksanterinkatu, 18 Musiikkitalo, 52 Ooppera, 21+4 Savoy/Kämp,
  96 Suomalainen Klubi). Loput tolpat ilman numeroa.