# TODOS

## T1 — Session expiry during offline sync
**What:** When the user queues entries offline and their Google session expires before reconnecting, the Server Action returns 401 and items stay silently in 'error' status with no user-visible feedback.

**Why:** Silent failure means the user believes their pain data was saved when it wasn't. This is the worst failure mode for a health tracker used by someone in pain.

**Pros:** Prevents silent data loss. Gives user a recovery path (re-auth prompt or clear error message).
**Cons:** Requires detecting 401 specifically in the sync error handler.
**Context:** Implement in Step 6 (offline queue hardening). The ActionResult<T> error contract (Step 2) makes the 401 case detectable. Behavior: when sync returns 401, show banner "Algunos registros no se sincronizaron. Inicia sesión de nuevo." with a link to re-auth.
**Depends on:** ActionResult<T> error contract (Step 2), offline queue hardening (Step 6)

---

## T2 — PDF charts on iOS Safari
**What:** html2canvas does not reliably resolve CSS custom properties (`--accent`, `--pain-high`, etc.) on iOS Safari. Charts may render as blank white boxes in the generated PDF.

**Why:** The doctor receives a PDF with white boxes where the correlation scatter plot and pain trend should be. The key clinical artifact is missing.

**Pros:** Ensures the PDF is useful on iOS (where the user will most likely generate it).
**Cons:** Workaround adds complexity to `lib/pdf.ts`.
**Context:** Two options: (1) resolve custom properties to hex values at capture time using `getComputedStyle()` before passing to html2canvas; (2) text-only fallback for pain summary if canvas capture fails. Choose whichever is simpler after testing. Step 9 already requires iPhone real-device testing before being marked complete — this TODO is the "what to do if it fails" plan.
**Depends on:** Step 9 (PDF export), iPhone real-device test

---

## T4 — Validate colorblind accessibility on pain gradient
**What:** Test the pain severity slider gradient (green→amber→red) with a user who has red-green colorblindness (deuteranopia/protanopia), or via a colorblindness simulator.
**Why:** The gradient is a pre-attentive severity read. For ~8% of male users, green and red look similar. The 0-10 number in Geist Mono is always the source of truth, but the gradient may lose meaning for colorblind users.
**Pros:** Validates the "number is sufficient" assumption made during /plan-design-review. Easy to test with online simulators before shipping.
**Cons:** May surface the need to add a second encoding (track fill thickness), adding implementation complexity.
**Context:** Decision made during /plan-design-review on 2026-03-29. Kept gradient as progressive enhancement, number as a11y-sufficient. This TODO tracks the validation of that assumption. If gradient fails the test, fix: track fill at 0-3 = 40% height, 4-6 = 65% height, 7-10 = 100% height (redundant encoding without changing DESIGN.md color spec).
**Depends on:** Step 3 (pain slider component complete)

---

## T3 — RLS with Auth.js JWT validation
**What:** Add a PostgreSQL function that validates the Auth.js session token so RLS policies can use real user identity checks (like `auth.uid()` in Supabase Auth). Currently RLS is `using (false)` with security enforced entirely in Server Actions.

**Why:** If any Server Action has a bug that skips the `user_id` check, any authenticated user could read or write any row. DB-level isolation would prevent this.

**Pros:** True defense-in-depth. DB rejects unauthorized queries even with application bugs.
**Cons:** Requires a custom Postgres function to decode and validate the Auth.js session token. Non-trivial. Supabase doesn't natively support Auth.js tokens in RLS.
**Context:** This is a personal single-user app — risk is low. The simpler mitigation is ensuring every Server Action validates session (already the pattern, per CLAUDE.md). This TODO is P2 security hardening, not a v1 blocker.
**Depends on:** All Server Actions complete

---

## T5 — Delete impact on correlation (copy spec)
**What:** When a morning check-in is deleted from Historial, the correlation n drops. If the deleted entry was the 14th data point, the correlation module drops below threshold and the scatter disappears from the dashboard. The warning modal in Step 3.5 says "Esto afectará tu correlación de sueño" — but needs to specify the UI copy for this edge case (disappearing correlation).

**Why:** Without explicit copy, the developer writing the Historial delete SA might use a generic warning that doesn't explain *how* it affects correlation. The user should understand "deleting this entry may remove the sleep correlation from your dashboard."

**Pros:** Prevents ambiguous warning copy. The recompute behavior is already correct (dashboard reloads on visit).
**Cons:** Minor — copy decision only.
**Context:** The dashboard recomputes on every load, so no special invalidation logic is needed. The only action needed is ensuring the delete warning modal copy accounts for the n < 14 consequence: "Este registro contiene datos de sueño. Eliminarlo podría afectar o eliminar la correlación en tu dashboard."
**Depends on:** Step 3.5 (Historial screen + delete SA)
