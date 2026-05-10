import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Index() {
  const navigate = useNavigate();
  const recentMeals = useQuery(api.meals.listRecent);
  const adventureData = useQuery(api.adventureProgress.getAll);

  const recentCount = recentMeals?.length ?? 0;
  const triedCount = adventureData?.filter((d) => d.progress?.tried).length ?? 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-gradient-to-b from-orange-50 to-white">
      <h1 className="text-5xl font-extrabold text-center">Dinner Maker 🍽️</h1>
      <p className="text-gray-500 text-center">
        Build your plate. Try new foods. Rate everything!
      </p>

      <button
        onClick={() => navigate("/build")}
        className="w-full max-w-sm rounded-3xl p-6 bg-orange-400 text-white shadow-lg hover:bg-orange-500 transition-colors flex items-center gap-4"
      >
        <span className="text-4xl">🍽️</span>
        <div className="text-left">
          <div className="font-bold text-xl">Build a Plate</div>
          <div className="text-sm opacity-90">Pick foods for each section</div>
        </div>
      </button>

      <button
        onClick={() => navigate("/adventure")}
        className="w-full max-w-sm rounded-3xl p-6 bg-green-500 text-white shadow-lg hover:bg-green-600 transition-colors flex items-center gap-4"
      >
        <span className="text-4xl">🗺️</span>
        <div className="text-left">
          <div className="font-bold text-xl">Food Adventure</div>
          <div className="text-sm opacity-90">
            {recentCount} meals made · {triedCount} / 38 foods tried
          </div>
        </div>
      </button>

      <button
        onClick={() => navigate("/inspire")}
        className="w-full max-w-sm rounded-3xl p-6 bg-purple-500 text-white shadow-lg hover:bg-purple-600 transition-colors flex items-center gap-4"
      >
        <span className="text-4xl">✨</span>
        <div className="text-left">
          <div className="font-bold text-xl">Inspire Me</div>
          <div className="text-sm opacity-90">AI picks your dinner</div>
        </div>
      </button>
    </div>
  );
}
