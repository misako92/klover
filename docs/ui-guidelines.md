# UI Guidelines (Dashboard B2B)

1. **Page container**: use the `dashboard-container` utility for all dashboard pages (consistent width, padding, and rhythm).
2. **Page title**: use `dashboard-title` with a single supporting line using `dashboard-subtitle`.
3. **Section titles**: `text-lg font-semibold text-foreground` with `mt-6` before and `mb-3` after.
4. **Body text**: default to `text-sm text-muted-foreground`; avoid stacking multiple muted paragraphs without spacing.
5. **Cards**: use `Card` with `border-border bg-card shadow-sm`; optional header surface `bg-muted/40` for summaries.
6. **Badges (status)**: semantic mapping: Success `bg-emerald-50 text-emerald-700 border-emerald-200`; Warning `bg-amber-50 text-amber-700 border-amber-200`; Error `bg-red-50 text-red-700 border-red-200`; Neutral `bg-muted/50 text-muted-foreground border-border`.
7. **Buttons**: primary action `bg-emerald-600 hover:bg-emerald-700 text-white`; icon-only buttons must include `aria-label`.
8. **Empty states**: use `components/ui/empty` with `border-dashed border-border bg-card/40` and a single CTA.
9. **Error states**: show an inline error near the failing action; use `Alert` with a recovery CTA.
10. **Loading**: use `Skeleton` with `bg-muted/50` and reserve final layout height to avoid jumps.
