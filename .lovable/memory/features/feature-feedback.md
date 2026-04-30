---
name: feature-feedback
description: In-app suggestion/feedback button on every section card and floating, stored in feature_feedback table
type: feature
---
# Feature Feedback

- `SuggestionButton` (src/components/SuggestionButton.tsx) — variants: inline | floating | icon.
- Inline trigger sits next to every section title in tabs Tutka, Säpinä, Liikenne, Hallinta.
- Floating lightbulb (bottom-right, above BottomNav) on Index sends feedback tagged with active tab.
- Categories: bug | improvement | idea | praise.
- Stored in public.feature_feedback (feature, context, message, rating, user_agent, created_at). RLS: anyone can insert and read.
- Distinct from FeedbackButtons (alue hiljainen / kuuma) which feeds the recommendation engine.
- Help text in HelpDrawer explains usage and warns against personal data.
