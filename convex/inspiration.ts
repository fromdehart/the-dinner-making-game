import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export const getSuggestions = action({
  args: { anchorFoodId: v.id("foods") },
  handler: async (ctx, args): Promise<Array<{ food: Doc<"foods">; reason: string }>> => {
    const allFoods = await ctx.runQuery(api.foods.listAll);
    const anchor = allFoods.find((f) => f._id === args.anchorFoodId);
    if (!anchor) {
      throw new Error("Anchor food not found");
    }

    const candidates = allFoods.filter((f) => f.group !== anchor.group);
    const candidateNames = candidates.map((f) => f.name);

    const prompt = `You are a fun meal planning helper for kids and families.
The child chose "${anchor.name}" as their favorite food tonight.
Suggest exactly 4 foods to go with it and complete a balanced dinner plate.
The anchor food is in the "${anchor.group}" group. Do NOT suggest another ${anchor.group} food.
You MUST only pick foods from this exact list: ${candidateNames.join(", ")}
Reply ONLY with JSON, no explanation:
{"suggestions":[{"name":"exact name from the list","group":"grains|protein|dairy|fruits|vegetables","reason":"one fun sentence for a kid"}]}`;

    const { text } = await ctx.runAction(internal.openai.generateText, {
      prompt,
      model: "gpt-4o-mini",
    });

    let parsed: { suggestions: { name: string; group: string; reason: string }[] };
    try {
      parsed = JSON.parse(text) as typeof parsed;
    } catch {
      return [];
    }

    const result: Array<{ food: Doc<"foods">; reason: string }> = [];
    for (const s of parsed.suggestions.slice(0, 4)) {
      const food = allFoods.find(
        (f) => f.name.toLowerCase() === s.name.toLowerCase()
      );
      if (food) {
        result.push({ food, reason: s.reason });
      }
    }
    return result;
  },
});
