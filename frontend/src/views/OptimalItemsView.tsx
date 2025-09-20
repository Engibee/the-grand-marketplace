import { useState, useEffect, useCallback } from "react";
import type { EquipmentItem, SlotEquipment, EquipmentAttribute } from "../types/api";

// Global cache for equipment data
let equipmentCache: EquipmentItem[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check if cache is valid
const isCacheValid = (): boolean => {
  return equipmentCache !== null && (Date.now() - cacheTimestamp) < CACHE_DURATION;
};

// Fetch equipment data from API or cache
const fetchEquipments = async (): Promise<EquipmentItem[]> => {
  // Return cached data if valid
  if (isCacheValid()) {
    console.log("📦 Using cached equipment data");
    return equipmentCache!;
  }

  console.log("🌐 Fetching fresh equipment data from API");
  const res = await fetch(`${__API_URL__}/optimal/equipments`);
  const data: EquipmentItem[] = await res.json();

  // Update cache
  equipmentCache = data;
  cacheTimestamp = Date.now();

  return data;
};

function OptimalItemsView() {
  const [slotEquipments, setSlotEquipments] = useState<SlotEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<string>("melee_strength");

  // Available attributes for efficiency sorting
  const attributes = [
    { key: "melee_strength", label: "Melee Strength", suffix: "_efficiency" },
    { key: "ranged_strength", label: "Ranged Strength", suffix: "_efficiency" },
    { key: "magic_damage", label: "Magic Damage", suffix: "_efficiency" },
    { key: "stab_acc", label: "Stab Accuracy", suffix: "_efficiency" },
    { key: "slash_acc", label: "Slash Accuracy", suffix: "_efficiency" },
    { key: "crush_acc", label: "Crush Accuracy", suffix: "_efficiency" },
    { key: "magic_acc", label: "Magic Accuracy", suffix: "_efficiency" },
    { key: "ranged_acc", label: "Ranged Accuracy", suffix: "_efficiency" },
    { key: "stab_def", label: "Stab Defence", suffix: "_efficiency" },
    { key: "slash_def", label: "Slash Defence", suffix: "_efficiency" },
    { key: "crush_def", label: "Crush Defence", suffix: "_efficiency" },
    { key: "magic_def", label: "Magic Defence", suffix: "_efficiency" },
    { key: "ranged_def", label: "Ranged Defence", suffix: "_efficiency" },
    { key: "prayer_bonus", label: "Prayer Bonus", suffix: "_efficiency" },
  ];

  // Group equipment by slot and sort by efficiency
  const groupEquipmentsBySlot = useCallback((equipments: EquipmentItem[]): SlotEquipment[] => {
    const grouped: { [slot: string]: EquipmentItem[] } = {};

    // Group by slot
    equipments.forEach(item => {
      if (!grouped[item.slot]) {
        grouped[item.slot] = [];
      }
      grouped[item.slot].push(item);
    });

    // Sort each slot by selected attribute efficiency and take top 5
    const result: SlotEquipment[] = [];
    Object.keys(grouped).forEach(slot => {
      const sortedItems = grouped[slot]
        .filter(item => {
          const attr = item[selectedAttribute as keyof EquipmentItem] as EquipmentAttribute;
          const efficiencyKey = selectedAttribute + "_efficiency";
          return attr && attr[efficiencyKey] !== null && attr[efficiencyKey] !== undefined && (attr[efficiencyKey] as number) > 0;
        })
        .sort((a, b) => {
          const attrA = a[selectedAttribute as keyof EquipmentItem] as EquipmentAttribute;
          const attrB = b[selectedAttribute as keyof EquipmentItem] as EquipmentAttribute;
          const efficiencyKey = selectedAttribute + "_efficiency";
          const effA = (attrA[efficiencyKey] as number) || 0;
          const effB = (attrB[efficiencyKey] as number) || 0;
          return effB - effA; // Descending order (highest efficiency first)
        })
        .slice(0, 5); // Top 5

      if (sortedItems.length > 0) {
        result.push({
          slot,
          items: sortedItems
        });
      }
    });

    return result.sort((a, b) => a.slot.localeCompare(b.slot));
  }, [selectedAttribute]);

  // Initial load
  useEffect(() => {
    const loadEquipments = async () => {
      setLoading(true);
      try {
        const data = await fetchEquipments();
        const groupedBySlot = groupEquipmentsBySlot(data);
        setSlotEquipments(groupedBySlot);
      } catch (err) {
        console.error("Error fetching equipment data:", err);
        setSlotEquipments([]);
      } finally {
        setLoading(false);
      }
    };

    loadEquipments();
  }, [groupEquipmentsBySlot]);

  // Update grouping when attribute selection changes (use cached data)
  useEffect(() => {
    if (equipmentCache) {
      console.log("🔄 Re-grouping cached data for new attribute:", selectedAttribute);
      const groupedBySlot = groupEquipmentsBySlot(equipmentCache);
      setSlotEquipments(groupedBySlot);
    }
  }, [selectedAttribute, groupEquipmentsBySlot]);

  // Helper function to format efficiency values
  const formatEfficiency = (efficiency: number | null): string => {
    if (efficiency === null || efficiency === 0) return "N/A";
    if (efficiency < 0.001) return efficiency.toExponential(2);
    return efficiency.toFixed(6);
  };

  // Helper function to format price
  const formatPrice = (price: string): string => {
    const num = parseInt(price);
    return num.toLocaleString() + " gp";
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-yellow-500 mb-4">
          ⚔️ Most Cost-Efficient Equipment by Slot
        </h2>
        <p className="text-gray-300 mb-4">
          Top 5 most cost-efficient items for each equipment slot, sorted by {attributes.find(a => a.key === selectedAttribute)?.label} efficiency.
        </p>

        {/* Attribute Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sort by Attribute Efficiency:
          </label>
          <select
            value={selectedAttribute}
            onChange={(e) => setSelectedAttribute(e.target.value)}
            className="bg-[#332B21] border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            {attributes.map(attr => (
              <option key={attr.key} value={attr.key}>
                {attr.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-yellow-500 text-lg">Loading equipment data...</div>
        </div>
      ) : slotEquipments.length > 0 ? (
        <div className="space-y-8">
          {slotEquipments.map(slotGroup => (
            <div key={slotGroup.slot} className="bg-[#332B21] rounded-lg p-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 border-b border-gray-600 pb-2">
                {slotGroup.slot} Slot
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {slotGroup.items.map((item, index) => {
                  const attribute = item[selectedAttribute as keyof EquipmentItem] as EquipmentAttribute;
                  const efficiencyKey = selectedAttribute + "_efficiency";
                  const efficiency = attribute?.[efficiencyKey] as number | null;
                  const value = attribute?.value;

                  return (
                    <div key={item.item_id} className="bg-[#3F3529] rounded-lg p-4 border border-gray-600 hover:border-yellow-500 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-yellow-400">#{index + 1}</span>
                        <span className="text-xs text-gray-400">{formatPrice(item.current_price)}</span>
                      </div>

                      <h4 className="font-semibold text-white text-sm mb-2 line-clamp-2">
                        {item.item_name}
                      </h4>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            {attributes.find(a => a.key === selectedAttribute)?.label}:
                          </span>
                          <span className="text-white font-medium">
                            {value || "0"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Efficiency:</span>
                          <span className="text-green-400 font-medium">
                            {formatEfficiency(efficiency)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {efficiency ? `${formatEfficiency(efficiency)} stat per gp` : "No efficiency data"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">
            No equipment data available
          </div>
          <div className="text-gray-500 text-sm">
            Equipment data may still be loading or unavailable
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimalItemsView;
