import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
