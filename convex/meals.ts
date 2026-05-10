import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const GROUP_VALIDATOR = v.union(
  v.literal("grains"),
  v.literal("protein"),
  v.literal("dairy"),
  v.literal("fruits"),
  v.literal("vegetables")
);

export const create = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.insert("meals", {
      status: "building",
      createdAt: Date.now(),
    });
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("meals")
      .withIndex("by_status", (q) => q.eq("status", "building"))
      .order("desc")
      .first();
  },
});

export const get = query({
  args: { mealId: v.id("meals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.mealId);
  },
});

export const getMealFoods = query({
  args: { mealId: v.id("meals") },
  handler: async (ctx, args) => {
    const mealFoods = await ctx.db
      .query("mealFoods")
      .withIndex("by_meal", (q) => q.eq("mealId", args.mealId))
      .collect();

    const result = [];
    for (const mealFood of mealFoods) {
      const food = await ctx.db.get(mealFood.foodId);
      if (!food) continue;
      const addonDocs = await Promise.all(mealFood.addonIds.map((id) => ctx.db.get(id)));
      const addons = addonDocs.filter((a): a is NonNullable<typeof a> => a !== null);
      result.push({ mealFood, food, addons });
    }
    return result;
  },
});

export const placeFood = mutation({
  args: {
    mealId: v.id("meals"),
    foodId: v.id("foods"),
    group: GROUP_VALIDATOR,
    addonIds: v.array(v.id("foods")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mealFoods")
      .withIndex("by_meal_and_group", (q) =>
        q.eq("mealId", args.mealId).eq("group", args.group)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return await ctx.db.insert("mealFoods", {
      mealId: args.mealId,
      foodId: args.foodId,
      group: args.group,
      addonIds: args.addonIds,
      placedAt: Date.now(),
    });
  },
});

export const removeFood = mutation({
  args: {
    mealId: v.id("meals"),
    group: GROUP_VALIDATOR,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mealFoods")
      .withIndex("by_meal_and_group", (q) =>
        q.eq("mealId", args.mealId).eq("group", args.group)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const finalize = mutation({
  args: { mealId: v.id("meals") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mealId, { status: "eating" });
  },
});

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("meals")
      .withIndex("by_status", (q) => q.eq("status", "done"))
      .order("desc")
      .take(10);
  },
});
