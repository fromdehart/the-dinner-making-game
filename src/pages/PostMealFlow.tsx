import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { StarPicker } from "../components/StarPicker";

type Confirmation = "ate" | "skipped";

export default function PostMealFlow() {
  const navigate = useNavigate();
  const { mealId } = useParams<{ mealId: string }>();
  const [confirmations, setConfirmations] = useState<Map<string, Confirmation>>(new Map());
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [phase, setPhase] = useState<"rating" | "summary">("rating");
  const [adventureFoodsUnlocked, setAdventureFoodsUnlocked] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const mealFoods = useQuery(api.meals.getMealFoods, {
    mealId: mealId as Id<"meals">,
  });
  const submitRatings = useMutation(api.ratings.submitRatings);

  // Flatten: base food + addons, deduped by _id
  const allFoods = (() => {
    if (!mealFoods) return [];
    const seen = new Set<string>();
    const result: Array<{ _id: string; name: string; emoji: string; isAdventureFood: boolean }> = [];
    for (const { food, addons } of mealFoods) {
      if (!seen.has(food._id)) {
        seen.add(food._id);
        result.push(food);
      }
      for (const addon of addons) {
        if (!seen.has(addon._id)) {
          seen.add(addon._id);
          result.push(addon);
        }
      }
    }
    return result;
  })();

  const allConfirmed = allFoods.length > 0 && allFoods.every((f) => confirmations.has(f._id));
  const allRated = allFoods.every(
    (f) => confirmations.get(f._id) !== "ate" || scores.has(f._id)
  );
  const canSave = allConfirmed && allRated && !submitting;

  const handleSave = async () => {
    if (!mealId) return;
    setSubmitting(true);
    try {
      const ratings = allFoods.map((f) => ({
        foodId: f._id as Id<"foods">,
        confirmed: confirmations.get(f._id) === "ate",
        score: scores.get(f._id),
      }));
      const { adventureFoodsUnlocked: unlocked } = await submitRatings({
        mealId: mealId as Id<"meals">,
        ratings,
      });
      setAdventureFoodsUnlocked(unlocked);
      setPhase("summary");
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "summary") {
    const ateItems = allFoods.filter((f) => confirmations.get(f._id) === "ate");
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center px-4 py-10 gap-6">
        <div className="text-6xl">✨</div>
        <h1 className="text-3xl font-extrabold text-center">Great job! 🌟</h1>
        {adventureFoodsUnlocked > 0 && (
          <div className="w-full max-w-sm bg-green-100 border border-green-300 rounded-2xl p-4 text-green-800 text-sm font-medium text-center">
            You tried {adventureFoodsUnlocked} new adventure food
            {adventureFoodsUnlocked !== 1 ? "s" : ""}! Check your adventure list! 🗺️
          </div>
        )}
        <div className="w-full max-w-sm space-y-2">
          {ateItems.map((f) => (
            <div key={f._id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
              <span className="text-2xl">{f.emoji}</span>
              <span className="flex-1 font-medium text-sm">{f.name}</span>
              {scores.has(f._id) && (
                <span className="text-amber-500 font-bold text-sm">★ {scores.get(f._id)}</span>
              )}
            </div>
          ))}
        </div>
        <div className="w-full max-w-sm space-y-3 pt-4">
          <button
            onClick={() => navigate("/build")}
            className="w-full rounded-2xl bg-orange-400 py-4 font-bold text-white text-lg hover:bg-orange-500"
          >
            Build another plate 🍽️
          </button>
          <button
            onClick={() => navigate("/adventure")}
            className="w-full rounded-2xl border-2 border-green-500 py-4 font-bold text-green-700 text-lg hover:bg-green-50"
          >
            See my adventure list 🗺️
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-lg mx-auto px-4 pb-8">
      <div className="sticky top-0 bg-white pt-4 pb-2 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ←
          </button>
          <h1 className="text-xl font-extrabold">How did dinner go? 🍽️</h1>
        </div>
      </div>

      <div className="space-y-3 pt-4">
        {allFoods.map((f) => {
          const conf = confirmations.get(f._id);
          return (
            <div key={f._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{f.emoji}</span>
                <div className="flex-1">
                  <span className="font-semibold text-sm">{f.name}</span>
                  {f.isAdventureFood && (
                    <span className="ml-1 text-xs">⭐</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setConfirmations((m) => new Map(m).set(f._id, "ate"))
                    }
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                      conf === "ate"
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-green-100"
                    }`}
                  >
                    I ate it! ✓
                  </button>
                  <button
                    onClick={() =>
                      setConfirmations((m) => new Map(m).set(f._id, "skipped"))
                    }
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                      conf === "skipped"
                        ? "bg-gray-400 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    I skipped it ✗
                  </button>
                </div>
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  conf === "ate" ? "max-h-24 mt-3" : "max-h-0"
                }`}
              >
                <StarPicker
                  value={scores.get(f._id) ?? null}
                  onChange={(score) =>
                    setScores((m) => new Map(m).set(f._id, score))
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full rounded-2xl bg-orange-400 py-4 font-bold text-white text-lg hover:bg-orange-500 disabled:opacity-50 transition-opacity"
        >
          {submitting ? "Saving…" : "Save My Meal! 🎉"}
        </button>
      </div>
    </div>
  );
}
