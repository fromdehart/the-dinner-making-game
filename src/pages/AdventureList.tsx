import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type Group = "grains" | "protein" | "dairy" | "fruits" | "vegetables";

const GROUPS: Group[] = ["grains", "protein", "dairy", "fruits", "vegetables"];

const GROUP_LABELS: Record<Group, string> = {
  grains: "Grains",
  protein: "Protein",
  dairy: "Dairy",
  fruits: "Fruits",
  vegetables: "Vegetables",
};

const GROUP_COLORS: Record<Group, string> = {
  grains: "bg-amber-400",
  protein: "bg-red-400",
  dairy: "bg-blue-400",
  fruits: "bg-orange-400",
  vegetables: "bg-green-500",
};

export default function AdventureList() {
  const navigate = useNavigate();
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const data = useQuery(api.adventureProgress.getAll);

  const total = data?.length ?? 0;
  const tried = data?.filter((d) => d.progress?.tried).length ?? 0;

  const filtered =
    activeGroup === "all"
      ? data ?? []
      : (data ?? []).filter((d) => d.food.group === activeGroup);

  const sorted = [...filtered].sort((a, b) => {
    const aTried = a.progress?.tried ? 1 : 0;
    const bTried = b.progress?.tried ? 1 : 0;
    if (aTried !== bTried) return aTried - bTried;
    return a.food.name.localeCompare(b.food.name);
  });

  return (
    <div className="min-h-screen bg-white max-w-lg mx-auto px-4 pb-8">
      <div className="sticky top-0 bg-white pt-4 pb-2 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ←
          </button>
          <h1 className="text-2xl font-extrabold">Food Adventure 🗺️</h1>
        </div>
        <p className="text-3xl font-bold text-center py-2">
          {tried} <span className="text-gray-400 text-xl font-normal">/ {total} foods tried</span>
        </p>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <TabBtn
            label={`All (${tried}/${total})`}
            active={activeGroup === "all"}
            onClick={() => setActiveGroup("all")}
            color="bg-gray-700"
          />
          {GROUPS.map((g) => {
            const groupItems = (data ?? []).filter((d) => d.food.group === g);
            const groupTried = groupItems.filter((d) => d.progress?.tried).length;
            return (
              <TabBtn
                key={g}
                label={`${GROUP_LABELS[g]} (${groupTried}/${groupItems.length})`}
                active={activeGroup === g}
                onClick={() => setActiveGroup(g)}
                color={GROUP_COLORS[g]}
              />
            );
          })}
        </div>
      </div>

      {/* Progress bar for active group */}
      {activeGroup !== "all" && (
        <div className="h-1.5 w-full rounded-full bg-gray-200 mb-4">
          <div
            className={`h-full rounded-full ${GROUP_COLORS[activeGroup as Group]}`}
            style={{
              width: `${
                filtered.length > 0
                  ? (filtered.filter((d) => d.progress?.tried).length / filtered.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      )}

      {/* Food list */}
      <div>
        {activeGroup === "all"
          ? GROUPS.map((g) => {
              const groupItems = sorted.filter((d) => d.food.group === g);
              if (groupItems.length === 0) return null;
              return (
                <div key={g}>
                  <p className="font-bold text-gray-700 text-sm uppercase tracking-wide py-2 mt-3">
                    {GROUP_LABELS[g]}
                  </p>
                  {groupItems.map((item) => (
                    <FoodRow key={item.food._id} item={item} />
                  ))}
                </div>
              );
            })
          : sorted.map((item) => <FoodRow key={item.food._id} item={item} />)}
      </div>
    </div>
  );
}

function TabBtn({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
        active ? `${color} text-white border-transparent` : "border-gray-200 text-gray-600"
      }`}
    >
      {label}
    </button>
  );
}

function FoodRow({
  item,
}: {
  item: { food: { name: string; emoji: string }; progress: { tried: boolean; bestScore?: number } | null };
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100">
      <span className="text-2xl">{item.food.emoji}</span>
      <span className="flex-1 font-medium text-sm">{item.food.name}</span>
      {item.progress?.tried ? (
        <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          Tried! {item.progress.bestScore ? `★ ${item.progress.bestScore}` : ""}
        </span>
      ) : (
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          Not yet
        </span>
      )}
    </div>
  );
}
