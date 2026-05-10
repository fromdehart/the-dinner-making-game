import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { FoodCard } from "../components/FoodCard";

export default function InspirationMode() {
  const navigate = useNavigate();
  const allFoods = useQuery(api.foods.listAll);
  const getSuggestions = useAction(api.inspiration.getSuggestions);

  const [anchorFood, setAnchorFood] = useState<Doc<"foods"> | null>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ food: Doc<"foods">; reason: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"pick" | "results">("pick");

  const filtered = (allFoods ?? []).filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleInspire = async () => {
    if (!anchorFood) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getSuggestions({ anchorFoodId: anchorFood._id as Id<"foods"> });
      setSuggestions(result);
      setPhase("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleBuild = () => {
    if (!anchorFood) return;
    const ids = suggestions.map((s) => s.food._id).join(",");
    navigate(`/build?anchor=${anchorFood._id}&suggestions=${ids}`);
  };

  const handleReset = () => {
    setSuggestions([]);
    setPhase("pick");
    setAnchorFood(null);
    setSearch("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white max-w-lg mx-auto px-4 pb-8 relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-50 gap-4">
          <span className="text-5xl animate-bounce">🍽️</span>
          <p className="text-gray-600 font-medium">Thinking up the perfect dinner…</p>
        </div>
      )}

      <div className="sticky top-0 bg-white pt-4 pb-2 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ←
          </button>
          <h1 className="text-xl font-extrabold">
            {phase === "pick" ? "What sounds good? 🤔" : "Tonight's dinner idea! ✨"}
          </h1>
        </div>
      </div>

      {phase === "pick" && (
        <div className="pt-4 space-y-4">
          <input
            type="text"
            placeholder="Search foods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[55vh] overflow-y-auto">
            {filtered.map((f) => (
              <FoodCard
                key={f._id}
                food={f}
                size="sm"
                selected={anchorFood?._id === f._id}
                onClick={() => setAnchorFood(anchorFood?._id === f._id ? null : f)}
              />
            ))}
          </div>
          <button
            onClick={handleInspire}
            disabled={!anchorFood || loading}
            className="w-full rounded-2xl bg-purple-500 py-4 font-bold text-white text-lg hover:bg-purple-600 disabled:opacity-50 transition-opacity"
          >
            Inspire Me! ✨
          </button>
        </div>
      )}

      {phase === "results" && anchorFood && (
        <div className="pt-4 space-y-6">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Your pick:</p>
            <FoodCard food={anchorFood} size="lg" />
          </div>

          <p className="text-center text-gray-500 font-medium">goes great with…</p>

          <div className="grid grid-cols-2 gap-4">
            {suggestions.map(({ food, reason }) => (
              <div key={food._id} className="flex flex-col items-center gap-2">
                <FoodCard food={food} size="md" />
                <p className="text-xs text-center text-gray-500 leading-snug">{reason}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleBuild}
              className="w-full rounded-2xl bg-orange-400 py-4 font-bold text-white text-lg hover:bg-orange-500"
            >
              Build this plate! 🍽️
            </button>
            <button
              onClick={handleReset}
              className="w-full rounded-2xl border-2 border-gray-300 py-3 font-semibold text-gray-600 hover:bg-gray-50"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
