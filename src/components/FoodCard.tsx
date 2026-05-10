interface FoodCardProps {
  food: { name: string; emoji: string; isAdventureFood?: boolean };
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export function FoodCard({ food, selected, onClick, size = "md" }: FoodCardProps) {
  const emojiSize = size === "lg" ? "text-5xl" : size === "md" ? "text-4xl" : "text-3xl";
  const padding = size === "lg" ? "p-4" : size === "md" ? "p-3" : "p-2";
  const border = selected
    ? "border-blue-400 ring-2 ring-blue-300"
    : "border-gray-100";

  return (
    <div
      className={`relative rounded-2xl bg-white shadow-sm border-2 cursor-pointer hover:scale-105 transition-transform select-none ${border} ${padding}`}
      onClick={onClick}
    >
      {food.isAdventureFood && (
        <span className="absolute top-1 right-1 text-xs">⭐</span>
      )}
      <div className={`${emojiSize} text-center py-2`}>{food.emoji}</div>
      <div className="text-sm font-medium text-center text-gray-700 pb-2 px-1">
        {food.name}
      </div>
    </div>
  );
}
