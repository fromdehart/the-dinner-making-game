import { query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const foods = await ctx.db
      .query("foods")
      .filter((q) => q.eq(q.field("isAdventureFood"), true))
      .collect();

    const result = [];
    for (const food of foods) {
      const progress = await ctx.db
        .query("adventureProgress")
        .withIndex("by_food", (q) => q.eq("foodId", food._id))
        .first();
      result.push({ food, progress: progress ?? null });
    }
    return result;
  },
});
