import { PlateSection } from "./PlateSection";

type Group = "grains" | "protein" | "dairy" | "fruits" | "vegetables";

interface PlacementData {
  food: { name: string; emoji: string } | null;
  addons: { name: string; emoji: string }[];
}

interface PlateDisplayProps {
  placements: Record<Group, PlacementData>;
  onSectionClick: (group: Group) => void;
}

export function PlateDisplay({ placements, onSectionClick }: PlateDisplayProps) {
  return (
    <div className="flex gap-3 w-full max-w-2xl mx-auto items-start">
      {/* Main plate */}
      <div
        className="flex-1 rounded-3xl overflow-hidden border-4 border-gray-300 shadow-lg"
        style={{ aspectRatio: "1.3" }}
      >
        <div className="flex h-full gap-[2px] bg-gray-300">
          {/* Left column: Fruits (40%) + Grains (60%) */}
          <div className="flex flex-col gap-[2px] w-[40%]">
            <div style={{ flex: 2 }}>
              <PlateSection
                group="fruits"
                food={placements.fruits.food}
                addons={placements.fruits.addons}
                onClick={() => onSectionClick("fruits")}
              />
            </div>
            <div style={{ flex: 3 }}>
              <PlateSection
                group="grains"
                food={placements.grains.food}
                addons={placements.grains.addons}
                onClick={() => onSectionClick("grains")}
              />
            </div>
          </div>

          {/* Right column: Vegetables (55%) + Protein (45%) */}
          <div className="flex flex-col gap-[2px] w-[60%]">
            <div style={{ flex: 11 }}>
              <PlateSection
                group="vegetables"
                food={placements.vegetables.food}
                addons={placements.vegetables.addons}
                onClick={() => onSectionClick("vegetables")}
              />
            </div>
            <div style={{ flex: 9 }}>
              <PlateSection
                group="protein"
                food={placements.protein.food}
                addons={placements.protein.addons}
                onClick={() => onSectionClick("protein")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dairy cup */}
      <div className="flex flex-col items-center gap-1 w-20">
        <div className="w-full h-28 rounded-2xl overflow-hidden border-4 border-gray-300 shadow">
          <PlateSection
            group="dairy"
            food={placements.dairy.food}
            addons={placements.dairy.addons}
            onClick={() => onSectionClick("dairy")}
            className="w-full h-full"
          />
        </div>
        <span className="text-xs text-gray-500 font-medium">Dairy</span>
      </div>
    </div>
  );
}
