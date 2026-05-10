import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

const GROUP_VALIDATOR = v.union(
  v.literal("grains"),
  v.literal("protein"),
  v.literal("dairy"),
  v.literal("fruits"),
  v.literal("vegetables")
);

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("foods").collect();
  },
});

export const listByGroup = query({
  args: { group: GROUP_VALIDATOR },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foods")
      .withIndex("by_group", (q) => q.eq("group", args.group))
      .collect();
  },
});

export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("foods").first();
    if (existing !== null) {
      return { seeded: false };
    }
    for (const food of FOOD_CATALOG) {
      await ctx.db.insert("foods", food);
    }
    return { seeded: true };
  },
});
