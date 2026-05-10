import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { FoodCard } from "./FoodCard";

type Group = "grains" | "protein" | "dairy" | "fruits" | "vegetables";

const GROUP_LABELS: Record<Group, string> = {
  grains: "Grains",
  protein: "Protein",
  dairy: "Dairy",
  fruits: "Fruits",
  vegetables: "Vegetables",
};

interface FoodPickerModalProps {
  open: boolean;
  group: Group | null;
  onSelect: (food: Doc<"foods">) => void;
  onClose: () => void;
}

export function FoodPickerModal({ open, group, onSelect, onClose }: FoodPickerModalProps) {
  const [search, setSearch] = useState("");
  const foods = useQuery(api.foods.listByGroup, group ? { group } : "skip");

  const filtered = foods?.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {group ? `${GROUP_LABELS[group]} foods` : "Foods"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
            {!filtered
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
                ))
              : filtered.map((f) => (
                  <FoodCard
                    key={f._id}
                    food={f}
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      onSelect(f);
                    }}
                  />
                ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
