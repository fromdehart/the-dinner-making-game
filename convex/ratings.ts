import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submitRatings = mutation({
  args: {
    mealId: v.id("meals"),
    ratings: v.array(
      v.object({
        foodId: v.id("foods"),
        confirmed: v.boolean(),
        score: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let adventureFoodsUnlocked = 0;

    for (const rating of args.ratings) {
      await ctx.db.insert("ratings", {
        mealId: args.mealId,
        foodId: rating.foodId,
        confirmed: rating.confirmed,
        score: rating.score,
        ratedAt: Date.now(),
      });

      if (rating.confirmed) {
        const food = await ctx.db.get(rating.foodId);
        if (!food) continue;

        if (food.isAdventureFood) {
          const existing = await ctx.db
            .query("adventureProgress")
            .withIndex("by_food", (q) => q.eq("foodId", rating.foodId))
            .first();

          if (!existing) {
            await ctx.db.insert("adventureProgress", {
              foodId: rating.foodId,
              tried: true,
              bestScore: rating.score ?? undefined,
              firstTriedAt: Date.now(),
            });
            adventureFoodsUnlocked++;
          } else if (!existing.tried) {
            await ctx.db.patch(existing._id, {
              tried: true,
              bestScore: rating.score ?? undefined,
              firstTriedAt: Date.now(),
            });
            adventureFoodsUnlocked++;
          } else if (rating.score !== undefined && rating.score > (existing.bestScore ?? 0)) {
            await ctx.db.patch(existing._id, { bestScore: rating.score });
          }
        }
      }
    }

    await ctx.db.patch(args.mealId, { status: "done" });
    return { adventureFoodsUnlocked };
  },
});

export const getMealRatings = query({
  args: { mealId: v.id("meals") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_meal", (q) => q.eq("mealId", args.mealId))
      .collect();

    const result = [];
    for (const rating of ratings) {
      const food = await ctx.db.get(rating.foodId);
      if (!food) continue;
      result.push({ rating, food });
    }
    return result;
  },
});
