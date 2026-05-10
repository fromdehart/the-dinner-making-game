# High-Level Plan: The Dinner Making Game

## What It Does
A kid-friendly meal-building game where players fill a divided plate by tapping food group sections and choosing foods. It also tracks a family "foods to try" adventure list and lets players rate everything they've eaten on a star scale (10–100 in increments of 10).

## Key Features
- **Plate Builder**: Visual plate laid out as proportional rectangles (MyPlate-style) split into food group sections (grains, protein, dairy, fruits, vegetables). Tap a section → pick a food → it visually fills that section of the plate. Repeat until the plate is full.
- **Visual Foods**: Every food in the catalog is represented with an illustration or large emoji. When selected, the food graphic animates into and fills its plate section (not just a label appearing — the section lights up/fills in with the food image).
- **Add-ons / Toppings**: When a food supports it (e.g. pasta), a secondary picker lets you layer on extras from other food groups (cheese, bacon, sauce), handling mixed-group dishes. Add-ons stack visually on the plate section.
- **Meal Inspiration Mode**: Pick an anchor food you're excited about and the app suggests complementary foods to round out the plate (AI-powered recommendations via gpt-5-mini).
- **Food Adventure List**: A curated checklist of standard, everyday foods kids should be working through — fish, common vegetables (broccoli, carrots, peas…), common fruits (mango, kiwi, berries…), whole grains, different proteins, etc. Not exotic — just the broad base of what a well-rounded kid diet covers. ~20 foods per group. Adventure foods are **not** checked off automatically when placed on the plate — they are only checked off during the post-meal rating step, and the player must manually confirm what they actually ate before the check-off registers.
- **Rating System**: After "eating" a meal, the player is shown each food from the plate and must manually confirm which ones they actually ate. For confirmed foods, they then rate using a star picker (10 stars; each star = 10 points, so scores run 10–20–30…–100). Checking off an adventure food happens here, tied to the manual "I ate this" confirmation. History shows what the family has tried and their scores.

## Tech Stack
- Frontend: React + Vite + Tailwind (template already in place)
- Backend: Convex (real-time, serverless — stores meals, adventure list, ratings)
- AI: OpenAI gpt-5-mini (Meal Inspiration Mode — suggest pairings given an anchor food)
- Auth: None for PoC — single shared family session (no login)

## Scope & Constraints
**In scope:**
- Plate Builder with all five food group sections as proportional rectangles
- Food graphics (illustrations or emoji) for every catalog item; animated fill when placed on plate
- Add-on picker for multi-group dishes
- Meal Inspiration Mode with AI-generated pairing suggestions (gpt-5-mini)
- Food Adventure List: ~20 foods per group, standard everyday foods, check-off tracking gated behind manual confirmation at rating time
- Post-meal flow: manual "I ate this" confirmation per food → 10-star rating picker (10–100 in increments of 10) → adventure list check-off for confirmed foods
- Food catalog: ~20 foods per section (100 foods total)

**Out of scope:**
- Voice input / speech-to-plate (mentioned but adds significant complexity)
- User accounts or multi-profile support
- Nutritional data or dietary restriction filtering
- Saving/sharing meal photos
- Mobile app (web responsive is fine)
- Free-slider ratings (stars only)
- Auto-checking adventure foods when a food is placed on the plate

## Implementation Approach
1. **Data model first** — Define Convex tables: `foods` (catalog with group, visual asset reference, add-on support flag), `meals` (saved plate builds), `adventureList` (foods + tried/not-tried + rating score), `ratings` (mealId + foodId + confirmed:bool + score 10–100).
2. **Food catalog** — Build out ~20 foods per group with emoji or illustration references. Cover the standard kid-diet staples: varied fish, veggies, fruits, proteins, grains, dairy.
3. **Plate Builder UI** — Render the MyPlate-style proportional rectangle layout; wire up section tap → food picker modal (showing food graphics in a grid) → animated fill of that plate section with the food's visual.
4. **Plate fill animation** — When a food is selected, its section transitions from empty to filled with the food graphic (CSS transition or Framer Motion). Makes the plate feel alive as it's built up.
5. **Add-on flow** — After selecting a base food that supports add-ons, show a secondary picker; merge selections into a single plate slot visually (stack or overlay graphics).
6. **Meal Inspiration Mode** — Input an anchor food, call gpt-5-mini to get 3–4 pairing suggestions, render as a proposed plate the user can accept/tweak.
7. **Post-meal flow** — After finishing a plate, show each food one at a time (or as a list): player taps "I ate this" / "I skipped this." For each confirmed food, show the 10-star picker and record the score. Only after manual confirmation does the food get checked off the adventure list. Show a summary of what was tried and the scores.
8. **Adventure List view** — Checklist grouped by food category showing tried/not-tried status and star scores for anything rated. Progress visible at a glance.

## Resolved Design Decisions
- **Plate layout**: Proportional rectangles (MyPlate-style), not pie wedges
- **Rating UI**: Star picker, 10 stars, each = 10 points (scores: 10, 20, 30 … 100) — no slider
- **Catalog size**: ~20 foods per food group
- **Adventure list**: Standard everyday foods kids should be trying (fish, common veggies, common fruits, etc.) — not unusual or exotic
- **Adventure list check-off**: Manual only — player must confirm they actually ate the food during the post-meal rating step; placing food on the plate does not count
- **AI model**: gpt-5-mini
