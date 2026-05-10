import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { PlateDisplay } from "../components/PlateDisplay";
import { FoodPickerModal } from "../components/FoodPickerModal";
import { AddonPickerModal } from "../components/AddonPickerModal";

type Group = "grains" | "protein" | "dairy" | "fruits" | "vegetables";
const GROUPS: Group[] = ["grains", "protein", "dairy", "fruits", "vegetables"];

interface Placement {
  food: { name: string; emoji: string } | null;
  addons: { name: string; emoji: string }[];
}

const EMPTY_PLACEMENTS: Record<Group, Placement> = {
  grains: { food: null, addons: [] },
  protein: { food: null, addons: [] },
  dairy: { food: null, addons: [] },
  fruits: { food: null, addons: [] },
  vegetables: { food: null, addons: [] },
};

export default function PlateBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mealId, setMealId] = useState<Id<"meals"> | null>(null);
  const [activePicker, setActivePicker] = useState<Group | null>(null);
  const [pendingBaseFood, setPendingBaseFood] = useState<Doc<"foods"> | null>(null);
  const [showAddonPicker, setShowAddonPicker] = useState(false);

  const createMeal = useMutation(api.meals.create);
  const seedIfEmpty = useMutation(api.foods.seedIfEmpty);
  const placeFood = useMutation(api.meals.placeFood);
  const removeFood = useMutation(api.meals.removeFood);
  const finalize = useMutation(api.meals.finalize);

  const activeMeal = useQuery(api.meals.getActive);
  const allFoods = useQuery(api.foods.listAll);
  const mealFoodsData = useQuery(
    api.meals.getMealFoods,
    mealId ? { mealId } : "skip"
  );

  const createdRef = useRef(false);
  const seededRef = useRef(false);
  const suggestionsAppliedRef = useRef(false);

  // Create or reuse meal
  useEffect(() => {
    if (activeMeal === undefined) return;
    if (activeMeal) {
      setMealId(activeMeal._id);
      return;
    }
    if (createdRef.current) return;
    createdRef.current = true;
    createMeal().then(setMealId);
  }, [activeMeal, createMeal]);

  // Seed foods if needed
  useEffect(() => {
    if (allFoods === undefined || seededRef.current) return;
    if (allFoods.length === 0) {
      seededRef.current = true;
      seedIfEmpty();
    }
  }, [allFoods, seedIfEmpty]);

  // Apply URL suggestions (from InspirationMode)
  useEffect(() => {
    if (suggestionsAppliedRef.current) return;
    if (!mealId || !allFoods || !mealFoodsData) return;
    if (mealFoodsData.length > 0) return; // plate already has foods

    const anchorId = searchParams.get("anchor");
    const suggestionsParam = searchParams.get("suggestions");
    if (!anchorId && !suggestionsParam) return;

    suggestionsAppliedRef.current = true;

    const ids = [
      ...(anchorId ? [anchorId] : []),
      ...(suggestionsParam ? suggestionsParam.split(",").filter(Boolean) : []),
    ];

    for (const id of ids) {
      const food = allFoods.find((f) => f._id === id);
      if (!food) continue;
      placeFood({
        mealId,
        foodId: food._id as Id<"foods">,
        group: food.group,
        addonIds: [],
      });
    }
  }, [mealId, allFoods, mealFoodsData, searchParams, placeFood]);

  // Build placements from meal data
  const placements: Record<Group, Placement> = { ...EMPTY_PLACEMENTS };
  if (mealFoodsData) {
    for (const { mealFood, food, addons } of mealFoodsData) {
      placements[mealFood.group] = {
        food: { name: food.name, emoji: food.emoji },
        addons: addons.map((a) => ({ name: a.name, emoji: a.emoji })),
      };
    }
  }

  const filledCount = GROUPS.filter((g) => placements[g].food !== null).length;

  const handleFoodSelected = (food: Doc<"foods">) => {
    setActivePicker(null);
    if (food.supportsAddons) {
      setPendingBaseFood(food);
      setShowAddonPicker(true);
    } else {
      if (!mealId) return;
      placeFood({
        mealId,
        foodId: food._id as Id<"foods">,
        group: food.group,
        addonIds: [],
      });
    }
  };

  const handleAddonConfirm = (addonIds: string[]) => {
    if (!mealId || !pendingBaseFood) return;
    setShowAddonPicker(false);
    placeFood({
      mealId,
      foodId: pendingBaseFood._id as Id<"foods">,
      group: pendingBaseFood.group,
      addonIds: addonIds as Id<"foods">[],
    });
    setPendingBaseFood(null);
  };

  const handleAddonSkip = () => {
    if (!mealId || !pendingBaseFood) return;
    setShowAddonPicker(false);
    placeFood({
      mealId,
      foodId: pendingBaseFood._id as Id<"foods">,
      group: pendingBaseFood.group,
      addonIds: [],
    });
    setPendingBaseFood(null);
  };

  const handleStartOver = () => {
    if (!mealId) return;
    for (const g of GROUPS) {
      if (placements[g].food !== null) {
        removeFood({ mealId, group: g });
      }
    }
  };

  const handleFinalize = async () => {
    if (!mealId) return;
    await finalize({ mealId });
    navigate(`/post-meal/${mealId}`);
  };

  const currentAddonIds = pendingBaseFood
    ? (mealFoodsData
        ?.find((mf) => mf.mealFood.group === pendingBaseFood.group)
        ?.mealFood.addonIds ?? [])
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ←
            </button>
            <h1 className="text-xl font-extrabold">Build Your Dinner Plate 🍽️</h1>
          </div>
          <button
            onClick={handleStartOver}
            disabled={filledCount === 0}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 border border-gray-300 rounded-lg px-3 py-1"
          >
            Start Over
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-1 pl-9">Tap a section to choose a food</p>
      </div>

      {/* Plate */}
      <div className="flex-1 flex flex-col justify-center px-4 py-4 gap-4">
        <PlateDisplay placements={placements} onSectionClick={setActivePicker} />
        <p className="text-center text-sm text-gray-500">
          {filledCount} of 5 sections filled
        </p>
      </div>

      {/* Finalize */}
      <div className="px-4 pb-6">
        <button
          onClick={handleFinalize}
          disabled={filledCount === 0}
          className="w-full rounded-2xl bg-orange-400 py-4 font-bold text-white text-lg hover:bg-orange-500 disabled:opacity-40 transition-opacity"
        >
          We&apos;re Done! Let&apos;s Eat! 🎉
        </button>
      </div>

      {/* Modals */}
      <FoodPickerModal
        open={activePicker !== null}
        group={activePicker}
        onSelect={handleFoodSelected}
        onClose={() => setActivePicker(null)}
      />
      <AddonPickerModal
        open={showAddonPicker}
        baseFood={pendingBaseFood}
        allFoods={allFoods ?? []}
        currentAddonIds={currentAddonIds as string[]}
        onConfirm={handleAddonConfirm}
        onSkip={handleAddonSkip}
        onClose={() => {
          setShowAddonPicker(false);
          setPendingBaseFood(null);
        }}
      />
    </div>
  );
}
