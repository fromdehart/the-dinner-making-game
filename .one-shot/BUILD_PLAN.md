# Build Plan: The Dinner Making Game

## 1. Overview

A kid-friendly meal-building web app where players fill a MyPlate-style divided plate by tapping food group sections and choosing foods. Tracks a family "Food Adventure" checklist and lets players rate every food they actually ate (10-star picker, scores 10–100). Post-meal flow gates adventure-list check-offs behind manual "I ate this" confirmation. AI Inspiration Mode (gpt-4o-mini via OpenAI Responses API) suggests complementary foods given an anchor pick.

Stack: React + Vite + Tailwind (existing template), Convex (real-time DB + serverless functions), OpenAI Responses API. No auth — single shared family session.

---

## 2. File Changes Required

### File: `convex/http.ts`
- Action: MODIFY
- Purpose: Remove illegal `"use node"` directive (httpAction cannot run in Node.js runtime per Convex rules) and remove unused telegram route.
- Key changes: Delete `"use node"` line, delete all telegram route code, keep only empty httpRouter export.

### File: `convex/schema.ts`
- Action: MODIFY
- Purpose: Replace template tables with game domain tables; keep `events` for analytics.
- Key changes: Remove `data`, `votes`, `leads` table definitions. Add `foods`, `meals`, `mealFoods`, `ratings`, `adventureProgress`.

### File: `convex/leads.ts`
- Action: DELETE
- Purpose: No email gate in this app.

### File: `convex/votes.ts`
- Action: DELETE
- Purpose: Voting feature not used.

### File: `convex/resend.ts`
- Action: DELETE
- Purpose: No email sending needed.

### File: `convex/telegram.ts`
- Action: DELETE
- Purpose: No Telegram integration needed.

### File: `convex/telegramClient.ts`
- Action: DELETE
- Purpose: No Telegram integration needed.

### File: `convex/openai.ts`
- Action: KEEP (no changes)
- Purpose: `generateText` action already handles OpenAI Responses API calls; used by inspiration module.

### File: `convex/tracking.ts`
- Action: KEEP (no changes)
- Purpose: Existing analytics event tracking; `events` table stays in schema.

### File: `convex/foods.ts`
- Action: CREATE
- Purpose: Food catalog queries and idempotent seed mutation.

### File: `convex/meals.ts`
- Action: CREATE
- Purpose: Meal lifecycle management — create, place/remove foods, finalize.

### File: `convex/ratings.ts`
- Action: CREATE
- Purpose: Post-meal rating submission; triggers adventure progress updates.

### File: `convex/adventureProgress.ts`
- Action: CREATE
- Purpose: Adventure list progress queries; progress written by ratings module.

### File: `convex/inspiration.ts`
- Action: CREATE
- Purpose: AI-powered meal pairing action; calls gpt-4o-mini via internal openai action.

### File: `src/App.tsx`
- Action: MODIFY
- Purpose: Remove email gate / GateScreen; add React Router routes for all game pages.
- Key changes: Delete `useGateAccess`, `GateScreen` import, gate logic. Add routes: `/` (Index), `/build` (PlateBuilder), `/post-meal/:mealId` (PostMealFlow), `/adventure` (AdventureList), `/inspire` (InspirationMode).

### File: `src/pages/Index.tsx`
- Action: MODIFY (full replacement)
- Purpose: Game home screen — mode selection hub.
- Key changes: Replace template demo content with three large navigation buttons (Build a Plate, Food Adventure, Inspire Me) plus recent meal count.

### File: `src/components/GateScreen.tsx`
- Action: DELETE
- Purpose: No email gate.

### File: `src/components/ShareButtons.tsx`
- Action: DELETE
- Purpose: Votes removed; ShareButtons references deleted `api.votes`.

### File: `src/utils/email.ts`
- Action: MODIFY
- Purpose: Remove Convex dependency (resend.ts deleted); prevent build errors.
- Key changes: Replace body with a stub that returns `{ success: false, error: "Email not configured" }` with no imports.

### File: `src/components/FoodCard.tsx`
- Action: CREATE
- Purpose: Reusable card displaying a food's emoji + name; used in pickers and adventure list.

### File: `src/components/StarPicker.tsx`
- Action: CREATE
- Purpose: 10-star interactive rating picker; emits score in range 10–100 (steps of 10).

### File: `src/components/PlateSection.tsx`
- Action: CREATE
- Purpose: Individual plate section rectangle; shows food graphic when filled, tap target when empty.

### File: `src/components/PlateDisplay.tsx`
- Action: CREATE
- Purpose: Assembles the 5 plate sections into a MyPlate-style proportional rectangle layout.

### File: `src/components/FoodPickerModal.tsx`
- Action: CREATE
- Purpose: Dialog modal showing all foods for a given group as a tappable grid.

### File: `src/components/AddonPickerModal.tsx`
- Action: CREATE
- Purpose: Secondary dialog for picking add-on foods from multiple groups (shown after base food that supportsAddons).

### File: `src/pages/PlateBuilder.tsx`
- Action: CREATE
- Purpose: Main game view — plate display, food picker flow, meal finalization.

### File: `src/pages/PostMealFlow.tsx`
- Action: CREATE
- Purpose: Post-meal confirmation ("I ate this" / "I skipped it") and star rating per food.

### File: `src/pages/AdventureList.tsx`
- Action: CREATE
- Purpose: Adventure checklist grouped by food group showing tried/not-tried + scores.

### File: `src/pages/InspirationMode.tsx`
- Action: CREATE
- Purpose: AI meal inspiration — pick anchor food, get complementary suggestions.

---

## 3. Convex Schema Changes

Full replacement of `convex/schema.ts`:

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // kept for analytics (convex/tracking.ts writes here)
  events: defineTable({
    challengeId: v.string(),
    sessionId: v.string(),
    eventName: v.string(),
    metadata: v.any(),
    timestamp: v.number(),
  }).index("by_challengeId", ["challengeId"]),

  foods: defineTable({
    name: v.string(),
    group: v.union(
      v.literal("grains"),
      v.literal("protein"),
      v.literal("dairy"),
      v.literal("fruits"),
      v.literal("vegetables")
    ),
    emoji: v.string(),
    supportsAddons: v.boolean(),
    addonGroups: v.array(v.string()),
    isAdventureFood: v.boolean(),
  }).index("by_group", ["group"]),

  meals: defineTable({
    status: v.union(
      v.literal("building"),
      v.literal("eating"),
      v.literal("done")
    ),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  mealFoods: defineTable({
    mealId: v.id("meals"),
    foodId: v.id("foods"),
    group: v.union(
      v.literal("grains"),
      v.literal("protein"),
      v.literal("dairy"),
      v.literal("fruits"),
      v.literal("vegetables")
    ),
    addonIds: v.array(v.id("foods")),
    placedAt: v.number(),
  })
    .index("by_meal", ["mealId"])
    .index("by_meal_and_group", ["mealId", "group"]),

  ratings: defineTable({
    mealId: v.id("meals"),
    foodId: v.id("foods"),
    confirmed: v.boolean(),
    score: v.optional(v.number()),
    ratedAt: v.number(),
  }).index("by_meal", ["mealId"]),

  adventureProgress: defineTable({
    foodId: v.id("foods"),
    tried: v.boolean(),
    bestScore: v.optional(v.number()),
    firstTriedAt: v.optional(v.number()),
  }).index("by_food", ["foodId"]),
});
```

---

## 4. Convex Functions

### `convex/http.ts` (simplified)
No "use node" — httpAction cannot use Node.js runtime per Convex rules. No routes needed:
```ts
import { httpRouter } from "convex/server";
const http = httpRouter();
export default http;
```

---

### `foods/listAll` (query)
- Purpose: Return every food record.
- Args: none
- Returns: `Doc<"foods">[]`
- Logic: `return await ctx.db.query("foods").collect()`

### `foods/listByGroup` (query)
- Purpose: Return foods filtered to a single group.
- Args: `{ group: v.union(v.literal("grains"), v.literal("protein"), v.literal("dairy"), v.literal("fruits"), v.literal("vegetables")) }`
- Returns: `Doc<"foods">[]`
- Logic: `return await ctx.db.query("foods").withIndex("by_group", q => q.eq("group", args.group)).collect()`

### `foods/seedIfEmpty` (mutation)
- Purpose: Idempotent one-time seed of 100 catalog foods. Safe to call on every app load.
- Args: none
- Returns: `{ seeded: boolean }`
- Logic:
  1. `const existing = await ctx.db.query("foods").first()`
  2. If `existing !== null`, return `{ seeded: false }`
  3. `for (const food of FOOD_CATALOG) { await ctx.db.insert("foods", food) }`
  4. Return `{ seeded: true }`

**FOOD_CATALOG constant** — define at top of `convex/foods.ts`, outside the exported functions:

```ts
const FOOD_CATALOG = [
  // GRAINS
  { name: "White Rice",        group: "grains" as const,     emoji: "🍚", supportsAddons: false, addonGroups: [] as string[],                              isAdventureFood: false },
  { name: "Brown Rice",        group: "grains" as const,     emoji: "🌾", supportsAddons: false, addonGroups: [] as string[],                              isAdventureFood: true  },
  { name: "Pasta",             group: "grains" as const,     emoji: "🍝", supportsAddons: true,  addonGroups: ["dairy","protein","vegetables"],             isAdventureFood: false },
  { name: "Spaghetti",         group: "grains" as const,     emoji: "🍝", supportsAddons: true,  addonGroups: ["dairy","protein","vegetables"],             isAdventureFood: false },
  { name: "Bread",             group: "grains" as const,     emoji: "🍞", supportsAddons: true,  addonGroups: ["protein","dairy","vegetables"],             isAdventureFood: false },
  { name: "Whole Wheat Bread", group: "grains" as const,     emoji: "🫓", supportsAddons: true,  addonGroups: ["protein","dairy","vegetables"],             isAdventureFood: true  },
  { name: "Oatmeal",           group: "grains" as const,     emoji: "🥣", supportsAddons: true,  addonGroups: ["fruits","dairy"],                          isAdventureFood: true  },
  { name: "Quinoa",            group: "grains" as const,     emoji: "🌾", supportsAddons: false, addonGroups: [] as string[],                              isAdventureFood: true  },
  { name: "Bagel",             group: "grains" as const,     emoji: "🥯", supportsAddons: false, addonGroups: [] as string[],                              isAdventureFood: false },
  { name: "Tortilla",          group: "grains" as const,     emoji: "🫔", supportsAddons: true,  addonGroups: ["protein","dairy","vegetables"],             isAdventureFood: false },
  { name: "Cornbread",         group: "grains" as const,     emoji: "🌽", supportsAddons: false, addonGroups: [] as string[],                              isAdventureFood: false },
  { name: "Pita Bread",        group: "grains" as const,     emoji: "🫓", supportsAddons: true,  addonGroups: ["protein","vegetables","dairy"],             isAdventureFood: false },
  { name: "English Muffin",    group: "grains" as const,     emoji: "🫓", supportsAddons: false, addonGroups: [] as string[],                              isAdventureFood: false },
  { name: "Pancakes",          group: "grains" as const,     emoji: "🥞", supportsAddons: true,  addonGroups: ["fruits","dairy"],                          isAdventureFood: false },
  { name: "Waffles",           group: "grains" as const,     emoji: "🧇", supportsAddons: true,  addonGroups: ["fruits","dairy"],                          isAdventureFood: false },
  { name: "Couscous",          group: "grains" as const,     emoji: "🌾", supportsAddons: false, addonGroups: [] as string[],                              isAdventureFood: true  },
  { name: "Crackers",          group: "grains" as const,     emoji: "🍘", supportsAddons: false, addonGroups: [] as string[],                              isAdventureFood: false },
  { name: "Noodles",           group: "grains" as const,     emoji: "🍜", supportsAddons: true,  addonGroups: ["dairy","protein","vegetables"],             isAdventureFood: false },
  { name: "Cereal",            group: "grains" as const,     emoji: "🥣", supportsAddons: false, addonGroups: [] as string[],                              isAdventureFood: false },
  { name: "Popcorn",           group: "grains" as const,     emoji: "🍿", supportsAddons: false, addonGroups: [] as string[],                              isAdventureFood: false },
  // PROTEIN
  { name: "Chicken",           group: "protein" as const,    emoji: "🍗", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Beef",              group: "protein" as const,    emoji: "🥩", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Salmon",            group: "protein" as const,    emoji: "🐟", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Tuna",              group: "protein" as const,    emoji: "🐟", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Shrimp",            group: "protein" as const,    emoji: "🦐", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Eggs",              group: "protein" as const,    emoji: "🥚", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Turkey",            group: "protein" as const,    emoji: "🦃", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Pork Chop",         group: "protein" as const,    emoji: "🥩", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Tofu",              group: "protein" as const,    emoji: "🫘", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Black Beans",       group: "protein" as const,    emoji: "🫘", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Lentils",           group: "protein" as const,    emoji: "🫘", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Peanut Butter",     group: "protein" as const,    emoji: "🥜", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Ham",               group: "protein" as const,    emoji: "🍖", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Fish Sticks",       group: "protein" as const,    emoji: "🐟", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Ground Beef",       group: "protein" as const,    emoji: "🥩", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Chickpeas",         group: "protein" as const,    emoji: "🫘", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Edamame",           group: "protein" as const,    emoji: "🫛", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Hot Dog",           group: "protein" as const,    emoji: "🌭", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Crab",              group: "protein" as const,    emoji: "🦀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Lamb",              group: "protein" as const,    emoji: "🥩", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  // DAIRY
  { name: "Milk",              group: "dairy" as const,      emoji: "🥛", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Cheddar Cheese",    group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Yogurt",            group: "dairy" as const,      emoji: "🥛", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Butter",            group: "dairy" as const,      emoji: "🧈", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Cream Cheese",      group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Cottage Cheese",    group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "String Cheese",     group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Mozzarella",        group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Parmesan",          group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Sour Cream",        group: "dairy" as const,      emoji: "🥛", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Whipped Cream",     group: "dairy" as const,      emoji: "🍦", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Chocolate Milk",    group: "dairy" as const,      emoji: "🍫", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "American Cheese",   group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Swiss Cheese",      group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Ice Cream",         group: "dairy" as const,      emoji: "🍨", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Ricotta",           group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Goat Cheese",       group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Provolone",         group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Half & Half",       group: "dairy" as const,      emoji: "🥛", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Brie",              group: "dairy" as const,      emoji: "🧀", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  // FRUITS
  { name: "Apple",             group: "fruits" as const,     emoji: "🍎", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Banana",            group: "fruits" as const,     emoji: "🍌", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Strawberry",        group: "fruits" as const,     emoji: "🍓", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Blueberry",         group: "fruits" as const,     emoji: "🫐", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Mango",             group: "fruits" as const,     emoji: "🥭", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Orange",            group: "fruits" as const,     emoji: "🍊", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Grapes",            group: "fruits" as const,     emoji: "🍇", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Watermelon",        group: "fruits" as const,     emoji: "🍉", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Pineapple",         group: "fruits" as const,     emoji: "🍍", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Kiwi",              group: "fruits" as const,     emoji: "🥝", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Peach",             group: "fruits" as const,     emoji: "🍑", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Pear",              group: "fruits" as const,     emoji: "🍐", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Raspberry",         group: "fruits" as const,     emoji: "🫐", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Cherry",            group: "fruits" as const,     emoji: "🍒", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Lemon",             group: "fruits" as const,     emoji: "🍋", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Cantaloupe",        group: "fruits" as const,     emoji: "🍈", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Plum",              group: "fruits" as const,     emoji: "🍑", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Pomegranate",       group: "fruits" as const,     emoji: "🍎", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Grapefruit",        group: "fruits" as const,     emoji: "🍊", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Avocado",           group: "fruits" as const,     emoji: "🥑", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  // VEGETABLES
  { name: "Broccoli",          group: "vegetables" as const, emoji: "🥦", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Carrots",           group: "vegetables" as const, emoji: "🥕", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Peas",              group: "vegetables" as const, emoji: "🫛", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Corn",              group: "vegetables" as const, emoji: "🌽", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Spinach",           group: "vegetables" as const, emoji: "🥬", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Cucumber",          group: "vegetables" as const, emoji: "🥒", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Bell Pepper",       group: "vegetables" as const, emoji: "🫑", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Tomato",            group: "vegetables" as const, emoji: "🍅", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Sweet Potato",      group: "vegetables" as const, emoji: "🍠", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Green Beans",       group: "vegetables" as const, emoji: "🫘", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Cauliflower",       group: "vegetables" as const, emoji: "🥦", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Celery",            group: "vegetables" as const, emoji: "🌿", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Zucchini",          group: "vegetables" as const, emoji: "🥒", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Asparagus",         group: "vegetables" as const, emoji: "🌿", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Mushroom",          group: "vegetables" as const, emoji: "🍄", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Kale",              group: "vegetables" as const, emoji: "🥬", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Onion",             group: "vegetables" as const, emoji: "🧅", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: false },
  { name: "Brussels Sprouts",  group: "vegetables" as const, emoji: "🥦", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Beet",              group: "vegetables" as const, emoji: "🍠", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
  { name: "Eggplant",          group: "vegetables" as const, emoji: "🍆", supportsAddons: false, addonGroups: [] as string[], isAdventureFood: true  },
];
```

Adventure food totals: Grains 5, Protein 8, Dairy 5, Fruits 8, Vegetables 12 = **38 total adventure foods**.

---

### `meals/create` (mutation)
- Purpose: Start a new meal session.
- Args: none
- Returns: `Id<"meals">`
- Logic: Insert `{ status: "building", createdAt: Date.now() }` into meals, return id.

### `meals/getActive` (query)
- Purpose: Return the current "building" meal or null.
- Args: none
- Returns: `Doc<"meals"> | null`
- Logic: `ctx.db.query("meals").withIndex("by_status", q => q.eq("status", "building")).order("desc").first()`

### `meals/get` (query)
- Purpose: Return a specific meal.
- Args: `{ mealId: v.id("meals") }`
- Returns: `Doc<"meals"> | null`
- Logic: `ctx.db.get(args.mealId)`

### `meals/getMealFoods` (query)
- Purpose: Return all placed foods for a meal, joined with food docs and addon food docs.
- Args: `{ mealId: v.id("meals") }`
- Returns: `Array<{ mealFood: Doc<"mealFoods">; food: Doc<"foods">; addons: Doc<"foods">[] }>`
- Logic:
  1. Query `mealFoods` by `by_meal` index.
  2. For each mealFood: `await ctx.db.get(mealFood.foodId)` for base food; `await Promise.all(mealFood.addonIds.map(id => ctx.db.get(id)))` for addons.
  3. Filter out any null lookups. Return assembled array.

### `meals/placeFood` (mutation)
- Purpose: Upsert — replace any existing food in this group slot with the new selection.
- Args: `{ mealId: v.id("meals"), foodId: v.id("foods"), group: v.union(...five literals...), addonIds: v.array(v.id("foods")) }`
- Returns: `Id<"mealFoods">`
- Logic:
  1. Query existing by `by_meal_and_group` index for `(mealId, group)`. If found, delete it.
  2. Insert new `{ mealId, foodId, group, addonIds, placedAt: Date.now() }`. Return new id.

### `meals/removeFood` (mutation)
- Purpose: Clear one plate section.
- Args: `{ mealId: v.id("meals"), group: v.union(...five literals...) }`
- Returns: none
- Logic: Query by `by_meal_and_group`, delete if found.

### `meals/finalize` (mutation)
- Purpose: Transition meal to "eating" — plate is done, entering post-meal rating flow.
- Args: `{ mealId: v.id("meals") }`
- Returns: none
- Logic: `ctx.db.patch(args.mealId, { status: "eating" })`

### `meals/listRecent` (query)
- Purpose: Return the 10 most recent done meals (for home screen count).
- Args: none
- Returns: `Doc<"meals">[]`
- Logic: `ctx.db.query("meals").withIndex("by_status", q => q.eq("status", "done")).order("desc").take(10)`

---

### `ratings/submitRatings` (mutation)
- Purpose: Batch-submit all post-meal ratings, mark meal done, update adventure progress for confirmed adventure foods.
- Args:
  ```ts
  {
    mealId: v.id("meals"),
    ratings: v.array(v.object({
      foodId: v.id("foods"),
      confirmed: v.boolean(),
      score: v.optional(v.number()),
    }))
  }
  ```
- Returns: `{ adventureFoodsUnlocked: number }`
- Logic:
  1. `let adventureFoodsUnlocked = 0`
  2. For each rating in `args.ratings`:
     - Insert into `ratings`: `{ mealId: args.mealId, foodId, confirmed, score, ratedAt: Date.now() }`.
     - If `confirmed === true`:
       - `const food = await ctx.db.get(rating.foodId)` (non-null by data integrity).
       - If `food.isAdventureFood`:
         - Look up `adventureProgress` by `by_food` index.
         - If none: insert `{ foodId, tried: true, bestScore: rating.score ?? undefined, firstTriedAt: Date.now() }`, increment counter.
         - If exists and `!existing.tried`: patch `{ tried: true, bestScore: rating.score ?? undefined, firstTriedAt: Date.now() }`, increment counter.
         - If exists and `existing.tried` and `rating.score` is set and `rating.score > (existing.bestScore ?? 0)`: patch `{ bestScore: rating.score }`.
  3. `await ctx.db.patch(args.mealId, { status: "done" })`.
  4. Return `{ adventureFoodsUnlocked }`.

### `ratings/getMealRatings` (query)
- Purpose: Return completed ratings for a meal joined with food data.
- Args: `{ mealId: v.id("meals") }`
- Returns: `Array<{ rating: Doc<"ratings">; food: Doc<"foods"> }>`
- Logic: Query `ratings` by `by_meal` index, join each with `ctx.db.get(rating.foodId)`, filter nulls.

---

### `adventureProgress/getAll` (query)
- Purpose: Return all adventure foods (isAdventureFood=true) paired with their progress if any.
- Args: none
- Returns: `Array<{ food: Doc<"foods">; progress: Doc<"adventureProgress"> | null }>`
- Logic:
  1. `const foods = await ctx.db.query("foods").filter(q => q.eq(q.field("isAdventureFood"), true)).collect()`
  2. For each food: `await ctx.db.query("adventureProgress").withIndex("by_food", q => q.eq("foodId", food._id)).first()`.
  3. Return `{ food, progress }` pairs.

---

### `inspiration/getSuggestions` (action — no "use node")
- Purpose: Ask OpenAI gpt-4o-mini for 4 complementary foods given an anchor food.
- Args: `{ anchorFoodId: v.id("foods") }`
- Returns: `Array<{ food: Doc<"foods">; reason: string }>`
- Logic:
  1. `const allFoods = await ctx.runQuery(api.foods.listAll)` — get full catalog.
  2. Find anchor: `const anchor = allFoods.find(f => f._id === args.anchorFoodId)`. Throw if not found.
  3. Build candidate list: foods where `group !== anchor.group`, extract names.
  4. Build prompt:
     ```
     You are a fun meal planning helper for kids and families.
     The child chose "${anchor.name}" as their favorite food tonight.
     Suggest exactly 4 foods to go with it and complete a balanced dinner plate.
     The anchor food is in the "${anchor.group}" group. Do NOT suggest another ${anchor.group} food.
     You MUST only pick foods from this exact list: ${candidateNames.join(", ")}
     Reply ONLY with JSON, no explanation:
     {"suggestions":[{"name":"exact name from the list","group":"grains|protein|dairy|fruits|vegetables","reason":"one fun sentence for a kid"}]}
     ```
  5. `const { text } = await ctx.runAction(internal.openai.generateText, { prompt, model: "gpt-4o-mini" })`.
  6. Parse: `const parsed = JSON.parse(text) as { suggestions: { name: string; group: string; reason: string }[] }`.
  7. For each suggestion, find matching food in `allFoods` by case-insensitive name: `allFoods.find(f => f.name.toLowerCase() === s.name.toLowerCase())`.
  8. Filter out non-matches. Return `{ food, reason }` for each match (up to 4).

---

## 5. React Components & Pages

### `FoodCard`
- File: `src/components/FoodCard.tsx`
- Props:
  ```ts
  {
    food: { name: string; emoji: string; isAdventureFood?: boolean };
    selected?: boolean;
    onClick?: () => void;
    size?: "sm" | "md" | "lg";
  }
  ```
- State: none (CSS hover only)
- Behavior: Tappable card. `selected` adds a colored ring. `isAdventureFood` shows a small ⭐ badge in top-right corner.
- Key UI:
  - Container: `rounded-2xl bg-white shadow-sm border-2 cursor-pointer hover:scale-105 transition-transform select-none`
  - Border: `border-gray-100` normally; `border-blue-400 ring-2 ring-blue-300` when selected.
  - Emoji: `text-5xl` (lg), `text-4xl` (md), `text-3xl` (sm). Centered, `py-2`.
  - Name: `text-sm font-medium text-center text-gray-700 pb-2 px-1`.
  - Adventure badge: absolute top-1 right-1, `text-xs` ⭐ (only when `isAdventureFood`).
  - Padding: `sm` = `p-2`, `md` = `p-3`, `lg` = `p-4`.

### `StarPicker`
- File: `src/components/StarPicker.tsx`
- Props: `{ value: number | null; onChange: (score: number) => void; disabled?: boolean }`
  - `value` is 10–100 (multiples of 10) or null.
- State: `hovered: number | null` (1–10, star index, for preview)
- Behavior: 10 star buttons. Clicking star `i` (1-indexed) calls `onChange(i * 10)`. Hovering previews filled stars.
- Key UI:
  - Row of 10 `<button>` elements, each showing `★` at `text-2xl sm:text-3xl`.
  - Star color: amber-400 when `i <= Math.max(hovered ?? 0, (value ?? 0) / 10)`, else gray-300.
  - Below row: score label `text-sm text-gray-500 mt-1 text-center`: `"${value} / 100 points"` or `"Tap a star to rate"` if null.
  - Entire component grayed and pointer-events-none when `disabled`.

### `PlateSection`
- File: `src/components/PlateSection.tsx`
- Props:
  ```ts
  {
    group: "grains" | "protein" | "dairy" | "fruits" | "vegetables";
    food: { name: string; emoji: string } | null;
    addons: { name: string; emoji: string }[];
    onClick: () => void;
    className?: string;
    style?: React.CSSProperties;
  }
  ```
- State: none
- Behavior: Full-area `<button>`. Transitions between empty and filled state based on `food` prop.
- Key UI:
  - Group colors (used for both empty bg tint and filled bg):
    ```ts
    const GROUP_COLORS = {
      grains:     { empty: "bg-amber-50  border-amber-200",  filled: "bg-amber-200"  },
      protein:    { empty: "bg-red-50    border-red-200",    filled: "bg-red-200"    },
      dairy:      { empty: "bg-blue-50   border-blue-200",   filled: "bg-blue-200"   },
      fruits:     { empty: "bg-orange-50 border-orange-200", filled: "bg-orange-200" },
      vegetables: { empty: "bg-green-50  border-green-200",  filled: "bg-green-200"  },
    }
    ```
  - Empty state: dashed border-2, group tint bg, centered flex-col with group label in gray-400 and `+` icon.
  - Filled state: solid filled bg, centered flex-col with emoji (`text-4xl sm:text-5xl`), food name in `text-xs font-semibold text-gray-700 mt-1`, addons as small `text-xl` emoji row below.
  - CSS transition: `transition-all duration-300` on the outer div.
  - Group label text: title-case of the group string ("Grains", "Protein", etc.).
  - Entire element is `w-full h-full flex items-center justify-center rounded-none` (rounded-none so the parent plate container provides the rounding).

### `PlateDisplay`
- File: `src/components/PlateDisplay.tsx`
- Props:
  ```ts
  {
    placements: Record<
      "grains" | "protein" | "dairy" | "fruits" | "vegetables",
      { food: { name: string; emoji: string } | null; addons: { name: string; emoji: string }[] }
    >;
    onSectionClick: (group: "grains" | "protein" | "dairy" | "fruits" | "vegetables") => void;
  }
  ```
- State: none
- Behavior: Purely presentational layout. Passes through click handler and placement state to each PlateSection.
- Key UI:
  ```
  <div class="flex gap-3 w-full max-w-2xl mx-auto items-start">

    <!-- Main plate: 4 sections in a 2-col flex layout -->
    <div class="flex-1 rounded-3xl overflow-hidden border-4 border-gray-300 shadow-lg"
         style={{ aspectRatio: "1.3" }}>
      <div class="flex h-full gap-[2px] bg-gray-300">

        <!-- Left column: Fruits (top 40%) + Grains (bottom 60%) -->
        <div class="flex flex-col gap-[2px] w-[40%]">
          <div style={{ flex: 2 }}>   <!-- Fruits, 40% of left col height -->
            <PlateSection group="fruits" ... />
          </div>
          <div style={{ flex: 3 }}>   <!-- Grains, 60% of left col height -->
            <PlateSection group="grains" ... />
          </div>
        </div>

        <!-- Right column: Vegetables (top 55%) + Protein (bottom 45%) -->
        <div class="flex flex-col gap-[2px] w-[60%]">
          <div style={{ flex: 11 }}>  <!-- Vegetables, 55% of right col height -->
            <PlateSection group="vegetables" ... />
          </div>
          <div style={{ flex: 9 }}>   <!-- Protein, 45% of right col height -->
            <PlateSection group="protein" ... />
          </div>
        </div>

      </div>
    </div>

    <!-- Dairy cup: separate small box to the right -->
    <div class="flex flex-col items-center gap-1 w-20">
      <div class="w-full h-28 rounded-2xl overflow-hidden border-4 border-gray-300 shadow">
        <PlateSection group="dairy" class="w-full h-full" ... />
      </div>
      <span class="text-xs text-gray-500 font-medium">Dairy</span>
    </div>

  </div>
  ```

### `FoodPickerModal`
- File: `src/components/FoodPickerModal.tsx`
- Props:
  ```ts
  {
    open: boolean;
    group: "grains" | "protein" | "dairy" | "fruits" | "vegetables" | null;
    onSelect: (food: Doc<"foods">) => void;
    onClose: () => void;
  }
  ```
- State: `search: string`
- Behavior: Uses `Dialog` from `src/components/ui/dialog.tsx`. Calls `useQuery(api.foods.listByGroup, group ? { group } : "skip")`. Filters foods by search string (name substring, case-insensitive). Clicking a FoodCard calls `onSelect(food)`.
- Key UI:
  - DialogTitle: "[GroupLabel] foods" (e.g., "Vegetable foods").
  - Search input at top of dialog body: `<input placeholder="Search..." />`.
  - Food grid: `grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1`.
  - Each item: `<FoodCard food={f} size="sm" onClick={() => onSelect(f)} />`.
  - Loading (query undefined): show 8 gray skeleton rectangles in the grid.
  - Close button in DialogHeader (uses default Dialog close behavior).

### `AddonPickerModal`
- File: `src/components/AddonPickerModal.tsx`
- Props:
  ```ts
  {
    open: boolean;
    baseFood: { name: string; emoji: string; addonGroups: string[] } | null;
    allFoods: Doc<"foods">[];
    currentAddonIds: string[];
    onConfirm: (addonIds: string[]) => void;
    onSkip: () => void;
    onClose: () => void;
  }
  ```
- State: `selected: Set<string>` — initialized from `currentAddonIds` when modal opens (useEffect on `open`).
- Behavior: Filters `allFoods` to those whose `group` is in `baseFood.addonGroups`. Toggle selection on FoodCard click. "Add These!" calls `onConfirm(Array.from(selected))`. "No thanks" calls `onSkip()`.
- Key UI:
  - DialogTitle: `"Add something to your ${baseFood?.name}?"`.
  - Subtitle: `"Optional — tap to add, tap again to remove"`.
  - Food grid: same `grid grid-cols-3 sm:grid-cols-4 gap-3` pattern, FoodCards with `selected` prop.
  - Bottom: two buttons row — `"No thanks"` (secondary/ghost) and `"Add These!"` (primary, disabled if nothing selected).
  - Group section headers if `addonGroups.length > 1` (e.g., "Dairy" header before dairy add-on foods).

---

### `PlateBuilder` (page)
- File: `src/pages/PlateBuilder.tsx`
- Props: none
- State:
  ```ts
  mealId: Id<"meals"> | null
  activePicker: "grains" | "protein" | "dairy" | "fruits" | "vegetables" | null
  pendingBaseFood: Doc<"foods"> | null
  showAddonPicker: boolean
  ```
- Behavior:
  1. On mount: call `useQuery(api.meals.getActive)`. Use existing meal if found; otherwise fire `createMeal` mutation (once, guarded by a ref so it doesn't double-fire).
  2. Also on mount (when `allFoods` resolves and is empty): call `seedIfEmpty` mutation.
  3. Read URL query params: `?anchor=id&suggestions=id1,id2,id3`. If present and `mealId` is set and no foods placed yet, call `placeFood` for each suggestion id (look up its group from `allFoods`, then call the mutation). Run this once via a ref guard.
  4. `useQuery(api.meals.getMealFoods, { mealId: mealId ?? "skip" })` provides current placement. Convert to `placements` record: `Record<group, { food, addons }>` — groups with no mealFood entry get `{ food: null, addons: [] }`.
  5. Section click → set `activePicker` to that group → `FoodPickerModal` opens.
  6. Food selected from `FoodPickerModal`:
     - Close picker (`activePicker = null`).
     - If `food.supportsAddons`: set `pendingBaseFood = food`, `showAddonPicker = true`.
     - Else: call `placeFood({ mealId, foodId: food._id, group: food.group, addonIds: [] })`.
  7. `AddonPickerModal` confirm: call `placeFood({ mealId, foodId: pendingBaseFood._id, group: pendingBaseFood.group, addonIds: confirmedIds })`.
  8. `AddonPickerModal` skip: call `placeFood({ mealId, foodId: pendingBaseFood._id, group: pendingBaseFood.group, addonIds: [] })`.
  9. "We're Done! Let's Eat!" enabled when `filledCount >= 1` (count of sections where `food !== null`). Calls `finalize({ mealId })` then `navigate("/post-meal/" + mealId)`.
  10. "Start Over": call `removeFood` for each filled group. Clears the plate.
- Key UI:
  - Header row: `"Build Your Dinner Plate 🍽️"` h1 + "Start Over" ghost button (right-aligned). Back arrow link to `/`.
  - Subtitle: `"Tap a section to choose a food"` in gray.
  - `<PlateDisplay />` centered, taking most of the screen.
  - Progress line below plate: `"X of 5 sections filled"`.
  - Full-width `"We're Done! Let's Eat! 🎉"` button at bottom; disabled + lighter color when 0 sections filled.
  - `FoodPickerModal` and `AddonPickerModal` as overlays.

---

### `PostMealFlow` (page)
- File: `src/pages/PostMealFlow.tsx`
- Props: none (reads `mealId` via `useParams<{ mealId: string }>()`)
- State:
  ```ts
  confirmations: Map<string, "ate" | "skipped">   // foodId → choice
  scores: Map<string, number>                       // foodId → 10–100
  phase: "rating" | "summary"
  adventureFoodsUnlocked: number
  submitting: boolean
  ```
- Behavior:
  1. Load `useQuery(api.meals.getMealFoods, { mealId })` to get all placed foods.
  2. Flatten food list: for each mealFood include base food + each addon food (deduplicated by `_id`).
  3. Render phase `"rating"`:
     - For each food in flattened list, render a card:
       - Left: emoji + name + optional adventure badge.
       - Right: "I ate it! ✓" (green) / "I skipped it ✗" (gray) toggle buttons.
       - If confirmed "ate": `StarPicker` slides in below card (via `max-h-0 → max-h-24` Tailwind transition with `overflow-hidden`).
     - "Save My Meal!" button at bottom: enabled when every food has a confirmation AND every "ate" food has a score.
     - On click: call `submitRatings` mutation with the collected data. On success: `phase = "summary"`, store `adventureFoodsUnlocked`.
  4. Render phase `"summary"`:
     - `"Great job! 🌟"` heading.
     - If `adventureFoodsUnlocked > 0`: green banner `"You tried ${adventureFoodsUnlocked} new adventure food${s}! Check your adventure list! 🗺️"`.
     - Table/list: for each "ate" food, show emoji, name, score as `"★ X0"`.
     - Two buttons: `"Build another plate"` → `navigate("/build")`, `"See my adventure list"` → `navigate("/adventure")`.
- Key UI:
  - Header: `"How did dinner go? 🍽️"` + back button.
  - Food card: white rounded-2xl card with left/right layout. `p-4`. Shadow-sm.
  - StarPicker inside card below the toggle buttons, only visible when "ate" selected.
  - "Save My Meal!" button: coral bg, full-width, disabled opacity when not ready.
  - Summary: large centered emoji ✨ at top, then congratulations text, then rated foods list.

---

### `AdventureList` (page)
- File: `src/pages/AdventureList.tsx`
- Props: none
- State: `activeGroup: string` — defaults to `"all"`
- Behavior:
  1. Load `useQuery(api.adventureProgress.getAll)`.
  2. Count overall tried: `data.filter(d => d.progress?.tried).length` out of `data.length`.
  3. Group tabs: All + 5 group names. Clicking filters the list.
  4. Per-group: count tried / total.
  5. Within displayed group: sort untried first (alphabetical), then tried (alphabetical).
- Key UI:
  - Header: `"Food Adventure 🗺️"` + back link.
  - Overall progress: `"X / 38 foods tried"` in large text.
  - Horizontal tab bar (scrollable on mobile): `All (X/38)`, `Grains (X/20)`, etc. Active tab has colored underline.
  - Per-group progress bar: thin `h-1.5 rounded-full bg-gray-200` with colored inner bar.
  - Food rows: `flex items-center gap-3 py-2 border-b border-gray-100`.
    - Left: emoji `text-2xl`.
    - Middle: food name `font-medium text-sm`.
    - Right: if tried: green `"Tried! ★ X0"` pill; else gray `"Not yet"` pill.
  - Group section headers when `activeGroup === "all"`: bold group name between groups.

---

### `InspirationMode` (page)
- File: `src/pages/InspirationMode.tsx`
- Props: none
- State:
  ```ts
  anchorFood: Doc<"foods"> | null
  search: string
  suggestions: Array<{ food: Doc<"foods">; reason: string }>
  loading: boolean
  error: string | null
  phase: "pick" | "results"
  ```
- Behavior:
  1. Load `useQuery(api.foods.listAll)` for the anchor picker.
  2. Phase `"pick"`: search input + scrollable grid of all foods (all groups). Filter by search. Tap to set `anchorFood` (toggle).
  3. "Inspire Me! ✨" button: enabled when `anchorFood !== null`. Sets `loading = true`, calls `useAction(api.inspiration.getSuggestions)({ anchorFoodId: anchorFood._id })`.
  4. On success: set `suggestions`, `loading = false`, `phase = "results"`.
  5. On error: `error = err.message`, `loading = false`.
  6. Phase `"results"`: show anchor + 4 suggestion cards.
  7. "Build this plate!" → `navigate("/build?anchor=" + anchorFood._id + "&suggestions=" + suggestions.map(s => s.food._id).join(","))`.
  8. "Try again" → reset `suggestions`, `phase = "pick"`, `anchorFood = null`.
- Key UI:
  - Phase pick:
    - Header: `"What sounds good? 🤔"`.
    - Search input: `"Search foods..."`.
    - Food grid: `grid grid-cols-4 sm:grid-cols-5 gap-2` of `FoodCard` (sm size). Selected anchor gets blue ring.
    - "Inspire Me! ✨" button: full-width, coral, disabled until anchor selected.
  - Loading overlay: semi-transparent white overlay with centered `"🍽️ Thinking up the perfect dinner..."` + spinning text.
  - Phase results:
    - Header: `"Tonight's dinner idea! ✨"`.
    - Anchor card: centered, `lg` size, labeled `"Your pick:"`.
    - `"goes great with..."` label.
    - 2×2 grid of suggestion cards (`md` size) each with reason text below the card.
    - Full-width `"Build this plate! 🍽️"` button.
    - `"Try again"` ghost button below.

---

### `Index` (home page)
- File: `src/pages/Index.tsx`
- Props: none
- State: none
- Behavior: Navigation hub. Uses `useNavigate`. Shows recent meal count from `useQuery(api.meals.listRecent)`.
- Key UI:
  ```
  <div class="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-gradient-to-b from-orange-50 to-white">
    <h1 class="text-5xl font-extrabold text-center">Dinner Maker 🍽️</h1>
    <p class="text-gray-500 text-center">Build your plate. Try new foods. Rate everything!</p>

    <!-- Mode cards, stacked vertically, each full-width up to max-w-sm -->
    <button onClick={() => navigate("/build")} class="w-full max-w-sm rounded-3xl p-6 bg-orange-400 text-white shadow-lg hover:bg-orange-500 transition-colors flex items-center gap-4">
      <span class="text-4xl">🍽️</span>
      <div class="text-left">
        <div class="font-bold text-xl">Build a Plate</div>
        <div class="text-sm opacity-90">Pick foods for each section</div>
      </div>
    </button>

    <button onClick={() => navigate("/adventure")} class="w-full max-w-sm rounded-3xl p-6 bg-green-500 text-white shadow-lg hover:bg-green-600 transition-colors flex items-center gap-4">
      <span class="text-4xl">🗺️</span>
      <div class="text-left">
        <div class="font-bold text-xl">Food Adventure</div>
        <div class="text-sm opacity-90">{recentCount} meals made · {triedCount} / 38 foods tried</div>
      </div>
    </button>

    <button onClick={() => navigate("/inspire")} class="w-full max-w-sm rounded-3xl p-6 bg-purple-500 text-white shadow-lg hover:bg-purple-600 transition-colors flex items-center gap-4">
      <span class="text-4xl">✨</span>
      <div class="text-left">
        <div class="font-bold text-xl">Inspire Me</div>
        <div class="text-sm opacity-90">AI picks your dinner</div>
      </div>
    </button>
  </div>
  ```
  `triedCount` computed from `useQuery(api.adventureProgress.getAll)` — count items where `progress?.tried === true`.

---

### `App` (root)
- File: `src/App.tsx`
- Key changes: Remove all imports of `GateScreen`, `VoteATron3000`, `VoteATronErrorBoundary`, `useGateAccess`. Keep `ConvexProvider` and `BrowserRouter`. Routes:
  ```tsx
  <Routes>
    <Route path="/"                  element={<Index />} />
    <Route path="/build"             element={<PlateBuilder />} />
    <Route path="/post-meal/:mealId" element={<PostMealFlow />} />
    <Route path="/adventure"         element={<AdventureList />} />
    <Route path="/inspire"           element={<InspirationMode />} />
  </Routes>
  ```
  No fallback route needed for PoC.

---

## 6. Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `VITE_CONVEX_URL` | `.env` (committed or injected at build time) | Convex deployment URL — required at runtime |
| `OPENAI_API_KEY` | Convex dashboard → Environment Variables | OpenAI key — consumed by `convex/openai.ts` server-side only |

No other env vars required. Remove or leave unused any template vars (`VITE_CHALLENGE_ID`, `RESEND_API_KEY`, `RESEND_FROM`, `TELEGRAM_*`, `VITE_RECAPTCHA_SITE_KEY`).

---

## 7. Build Sequence

Follow this order exactly. Do not proceed to the next step if the current one has type errors.

1. **Fix `convex/http.ts`** — Remove `"use node"` and all telegram code. Final file: just `import { httpRouter } from "convex/server"; const http = httpRouter(); export default http;`

2. **Replace `convex/schema.ts`** — New schema as in Section 3. Removes `data`, `votes`, `leads`; adds five game tables; keeps `events`.

3. **Delete Convex template files** — Delete: `convex/leads.ts`, `convex/votes.ts`, `convex/resend.ts`, `convex/telegram.ts`, `convex/telegramClient.ts`.

4. **Stub `src/utils/email.ts`** — Replace entire file content with:
   ```ts
   export async function sendEmail(_to: string, _subject: string, _html: string) {
     return { success: false as const, error: "Email not configured" };
   }
   ```

5. **Delete `src/components/GateScreen.tsx`** and **`src/components/ShareButtons.tsx`**.

6. **Create `convex/foods.ts`** — `listAll`, `listByGroup` queries + `seedIfEmpty` mutation with full 100-food FOOD_CATALOG constant.

7. **Create `convex/meals.ts`** — `create`, `getActive`, `get`, `getMealFoods`, `placeFood`, `removeFood`, `finalize`, `listRecent`.

8. **Create `convex/ratings.ts`** — `submitRatings` mutation, `getMealRatings` query.

9. **Create `convex/adventureProgress.ts`** — `getAll` query.

10. **Create `convex/inspiration.ts`** — `getSuggestions` action (no "use node").

11. **Run `npx convex codegen`** — Must exit 0. Regenerates `convex/_generated/api.ts` with all new function signatures. Fix any Convex schema or function type errors before continuing.

12. **Modify `src/App.tsx`** — Remove GateScreen/VoteATron/gate logic. Add five routes as specified.

13. **Create `src/components/FoodCard.tsx`**.

14. **Create `src/components/StarPicker.tsx`**.

15. **Create `src/components/PlateSection.tsx`**.

16. **Create `src/components/PlateDisplay.tsx`**.

17. **Create `src/components/FoodPickerModal.tsx`** — Imports `api.foods.listByGroup`.

18. **Create `src/components/AddonPickerModal.tsx`**.

19. **Modify `src/pages/Index.tsx`** — Full replacement with game home. Imports `api.meals.listRecent` and `api.adventureProgress.getAll`.

20. **Create `src/pages/AdventureList.tsx`** — Imports `api.adventureProgress.getAll`.

21. **Create `src/pages/PostMealFlow.tsx`** — Imports `api.meals.getMealFoods` and `api.ratings.submitRatings`.

22. **Create `src/pages/InspirationMode.tsx`** — Imports `api.foods.listAll` and `api.inspiration.getSuggestions`.

23. **Create `src/pages/PlateBuilder.tsx`** — Imports all meals mutations, `api.foods.listAll`, `api.foods.seedIfEmpty`. This is last because it uses all other components.

24. **Run `npm run build`** — Must exit 0. Resolve any TypeScript errors in strict mode.

25. **Smoke test**: Run `npm run dev:with-convex`. Open browser at localhost:5173. Navigate to `/build`. Food picker should show 20 foods per group (seeded on first load). Build and rate a complete meal end-to-end.

---

## 8. Test Criteria

### Build checks
- `npm run build` exits 0 with zero TypeScript errors.
- `npx convex codegen` exits 0 — schema and all function signatures are valid.
- No `"use node"` in `convex/http.ts` (would cause Convex deployment error).

### Functional smoke tests (manual, in browser)

1. **Seed on first load**: open `/build`. FoodPickerModal for any section shows exactly 20 foods. Grains picker includes Pasta, Quinoa, Popcorn. Vegetables picker includes Broccoli, Kale, Eggplant.

2. **Plate building — basic**: tap Vegetables → select Broccoli → section fills with 🥦 and "Broccoli" label. Repeat for Grains (Pasta), Protein (Salmon), Fruits (Mango), Dairy (Milk). All 5 sections filled. "We're Done" button becomes fully opaque and clickable.

3. **Plate building — add-ons**: select Pasta in Grains section → AddonPickerModal appears offering dairy/protein/vegetable options → select Parmesan → plate section shows 🍝 with small 🧀 stacked below.

4. **Replace food**: tap a filled section → picker opens → select different food → section updates to new food.

5. **Start Over**: click "Start Over" → all 5 sections clear to empty state.

6. **Post-meal flow navigation**: build a plate, click "We're Done! Let's Eat!" → navigates to `/post-meal/[mealId]`. All plate foods listed.

7. **Post-meal confirmation + rating**: mark Broccoli as "ate" → StarPicker slides in → tap 8 stars → score shows "80 / 100 points". Mark Salmon as "ate" → rate. Mark Milk as "skipped". Remaining foods marked. "Save My Meal!" becomes enabled. Click → summary screen appears.

8. **Adventure progress update**: after saving meal with Broccoli "ate" (80 pts) → navigate to `/adventure` → Broccoli shows "Tried! ★ 80" green badge. Salmon shows "Tried!". Milk not listed as tried (was skipped).

9. **Adventure list filtering**: click "Vegetables" tab → only vegetable foods shown. Untried appear before tried. Per-group progress bar shows 1–2/12 filled.

10. **Home screen counts**: navigate to `/` → adventure button shows updated tried count.

11. **Inspiration mode**: navigate to `/inspire` → select Chicken as anchor → click "Inspire Me!" → loading state shows → 4 suggestion cards appear (from non-protein groups, all names matching real catalog foods) → click "Build this plate!" → navigates to `/build` with pre-filled sections.

12. **Idempotent seed**: refresh the page → foods query still returns 100 foods (no duplicates). `seedIfEmpty` skipped because foods already exist.

### Convex data integrity checks
- `placeFood` called twice for same `(mealId, group)` → only 1 mealFood record exists after second call (upsert replaced the first).
- `submitRatings` only sets `adventureProgress.tried = true` for foods where `confirmed === true` AND `food.isAdventureFood === true`.
- `adventureProgress.bestScore` only updates if new score > existing best.
- A second submission for the same adventure food increments `bestScore` if higher, does NOT reset `firstTriedAt`.

---

## 9. Deployment Notes

### Convex deployment
- `npx convex deploy` pushes schema and all functions. The dashboard URL appears in output.
- Set `OPENAI_API_KEY` in Convex dashboard → Settings → Environment Variables. Required for InspirationMode.
- `http.ts` exports an empty router — no webhook routes to configure.
- `seedIfEmpty` runs automatically when the first user opens `/build`. No manual seeding step.

### Vercel
- Build command: `npm run build`
- Output directory: `dist`
- Set environment variable: `VITE_CONVEX_URL` = production Convex URL from dashboard.
- Add `vercel.json` for client-side routing:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

### Session model
Single Convex deployment, no auth. All family members share one `adventureProgress` table and one global meal history. This is intentional for the PoC. If multi-profile support is added later, `adventureProgress` would need a `profileId` field.
