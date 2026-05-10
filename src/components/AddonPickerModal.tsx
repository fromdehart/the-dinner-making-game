import { useState, useEffect } from "react";
import { Doc } from "../../convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { FoodCard } from "./FoodCard";

interface AddonPickerModalProps {
  open: boolean;
  baseFood: { name: string; emoji: string; addonGroups: string[] } | null;
  allFoods: Doc<"foods">[];
  currentAddonIds: string[];
  onConfirm: (addonIds: string[]) => void;
  onSkip: () => void;
  onClose: () => void;
}

const GROUP_LABELS: Record<string, string> = {
  grains: "Grains",
  protein: "Protein",
  dairy: "Dairy",
  fruits: "Fruits",
  vegetables: "Vegetables",
};

export function AddonPickerModal({
  open,
  baseFood,
  allFoods,
  currentAddonIds,
  onConfirm,
  onSkip,
  onClose,
}: AddonPickerModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSelected(new Set(currentAddonIds));
    }
  }, [open, currentAddonIds]);

  if (!baseFood) return null;

  const candidates = allFoods.filter((f) =>
    baseFood.addonGroups.includes(f.group)
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const multiGroup = baseFood.addonGroups.length > 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add something to your {baseFood.name}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 -mt-2">
          Optional — tap to add, tap again to remove
        </p>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {multiGroup
            ? baseFood.addonGroups.map((g) => {
                const groupFoods = candidates.filter((f) => f.group === g);
                if (groupFoods.length === 0) return null;
                return (
                  <div key={g}>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                      {GROUP_LABELS[g] ?? g}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {groupFoods.map((f) => (
                        <FoodCard
                          key={f._id}
                          food={f}
                          size="sm"
                          selected={selected.has(f._id)}
                          onClick={() => toggle(f._id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {candidates.map((f) => (
                  <FoodCard
                    key={f._id}
                    food={f}
                    size="sm"
                    selected={selected.has(f._id)}
                    onClick={() => toggle(f._id)}
                  />
                ))}
              </div>
            )}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-xl border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            No thanks
          </button>
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => onConfirm(Array.from(selected))}
            className="flex-1 rounded-xl bg-orange-400 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
          >
            Add These!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
