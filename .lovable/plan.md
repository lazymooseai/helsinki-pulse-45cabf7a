## Goal

Replace the long single-scroll dashboard at `/index` with a fixed bottom navigation bar driving 4 tabs. Reuse existing components — no business-logic changes.

## New Structure

```
<DashboardProvider>
  <DashboardHeader />          (kept, slim)
  <HslTicker />                (kept, slim)
  <main pb-24>{activeTab}</main>
  <BottomNav />                (fixed bottom, 4 tabs)
  <ScanButton />               (kept, repositioned above nav)
</DashboardProvider>
```

State: `useState<'tutka'|'liikenne'|'sapina'|'hallinta'>('tutka')` lifted in `Index.tsx`.

## Tabs

**Tab 1 — Tutka (Radar icon)**
- `<CommandCenter />` as the prominent Suositusalue card on top (already the recommendation hero)
- `<JackpotAlert />` directly under it for urgent event highlight
- New compact `NextArrivalsCarousel` — horizontal `overflow-x-auto snap-x` strip pulling from `DashboardContext` (next 1–2 trains/ships/flights). Reuses existing data hooks; cards are slim versions of CapacityFeeds items
- `<PrebookingsCard />` at bottom (already has large action button)

**Tab 2 — Liikenne (Train icon)**
- New `TrafficTab` with sticky pill filter `[Junat] [Laivat] [Lennot]` (single-select, default Junat)
- Renders a clean vertical list filtered from the same arrival data CapacityFeeds uses. Each row: time, delay badge (red >0 / green on-time), capacity. Strip out tabs/clutter from CapacityFeeds — extract list rendering into a reusable `ArrivalsList` (new file) and call it with the active mode

**Tab 3 — Säpinä (TrendingUp icon)**
- `<EventsTimeline />` (events with end times — already shows this)
- `<DispatchLiveCard />` for "Kysyntä tolpilla" + Top alueet (already its purpose)

**Tab 4 — Hallinta (Settings icon)**
- `<TripsTabs />` containing the route search + manual entry + import (already provides Lähtö/Kohde search, time, price, CSV/XLSX drop)
- `<TripHistoryCard />` for Kyytihistoria stats
- `<DevTools />` and `<TrafficCameras />` collapsed below (admin-y)
- `<FeedbackButtons />` at bottom

## New Files

- `src/components/BottomNav.tsx` — fixed bottom bar, 4 buttons, active state with neon green underline + icon fill, 64px tall, safe-area inset
- `src/components/tabs/TutkaTab.tsx`
- `src/components/tabs/LiikenneTab.tsx` — sticky pill header + list
- `src/components/tabs/SapinaTab.tsx`
- `src/components/tabs/HallintaTab.tsx`
- `src/components/NextArrivalsCarousel.tsx` — horizontal swipe cards
- `src/components/ArrivalsList.tsx` — vertical clean list, accepts mode prop

## Modified Files

- `src/pages/Index.tsx` — tab switching, replace flat layout
- `src/components/ScanButton.tsx` — bump bottom offset to clear nav (`bottom-24`)

## Visual / a11y

- BottomNav: `bg-slate-900 border-t border-slate-800`, active tab text `text-emerald-400` with icon size 28, label `text-xs font-bold uppercase`. Tap target ≥ 64×64px.
- Pill filters in Liikenne: `h-12 px-6 rounded-full`, active = `bg-emerald-400 text-slate-900`, inactive = `bg-slate-800 text-slate-300`.
- All cards keep existing high-contrast tokens; no new colors.

## Out of Scope

- No changes to data fetching, edge functions, scoring, or memory rules.
- Existing components remain importable for backwards compatibility.
