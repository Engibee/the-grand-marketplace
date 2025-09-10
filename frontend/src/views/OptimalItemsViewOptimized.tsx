import { useState, useEffect } from "react";

interface OptimizedEquipmentItem {
  item_id: number;
  item_name: string;
  current_price: number;
  slot: string;
  attribute_value: number;
  efficiency: number;
}

interface SlotData {
  slot: string;
  items: OptimizedEquipmentItem[];
}

function OptimalItemsViewOptimized() {
  const [slotData, setSlotData] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<string>("melee_strength");

  // Available attributes for efficiency sorting
  const attributes = [
    { key: "melee_strength", label: "Melee Strength" },
    { key: "ranged_strength", label: "Ranged Strength" },
    { key: "magic_damage", label: "Magic Damage" },
    { key: "stab_acc", label: "Stab Accuracy" },
    { key: "slash_acc", label: "Slash Accuracy" },
    { key: "crush_acc", label: "Crush Accuracy" },
    { key: "magic_acc", label: "Magic Accuracy" },
    { key: "ranged_acc", label: "Ranged Accuracy" },
    { key: "stab_def", label: "Stab Defence" },
    { key: "slash_def", label: "Slash Defence" },
    { key: "crush_def", label: "Crush Defence" },
    { key: "magic_def", label: "Magic Defence" },
    { key: "ranged_def", label: "Ranged Defence" },
    { key: "prayer_bonus", label: "Prayer Bonus" },
  ];

  // Fetch optimized data for selected attribute
  useEffect(() => {
    const fetchOptimizedData = async () => {
      setLoading(true);
      try {
        console.log(`🚀 Fetching optimized data for ${selectedAttribute}`);
        const res = await fetch(`${__API_URL__}/optimal/equipments/${selectedAttribute}`);
        const data: OptimizedEquipmentItem[] = await res.json();

        // Group by slot
        const grouped = data.reduce((acc: { [slot: string]: OptimizedEquipmentItem[] }, item) => {
          if (!acc[item.slot]) {
            acc[item.slot] = [];
          }
          acc[item.slot].push(item);
          return acc;
        }, {});

        // Convert to array format
        const slotArray: SlotData[] = Object.keys(grouped)
          .map(slot => ({
            slot,
            items: grouped[slot]
          }))
          .sort((a, b) => a.slot.localeCompare(b.slot));

        setSlotData(slotArray);
      } catch (err) {
        console.error("Error fetching optimized equipment data:", err);
        setSlotData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptimizedData();
  }, [selectedAttribute]);

  // Helper function to format efficiency values
  const formatEfficiency = (efficiency: number): string => {
    if (efficiency >= 1) {
      return efficiency.toFixed(2);
    } else {
      return efficiency.toFixed(4);
    }
  };

  // Helper function to format prices
  const formatPrice = (price: number): string => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K`;
    }
    return price.toString();
  };

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">🏆 Most Cost-Efficient Equipment</h1>
        <p className="text-gray-600 mb-6">Top 5 items per slot sorted by {attributes.find(a => a.key === selectedAttribute)?.label} efficiency</p>

        {/* Attribute Selector */}
        <div className="my-5">
          <label htmlFor="attribute-select" className="mr-3 text-gray-700 font-medium">Sort by: </label>
          <select
            id="attribute-select"
            value={selectedAttribute}
            onChange={(e) => setSelectedAttribute(e.target.value)}
            className="px-3 py-2 border-2 border-blue-500 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {attributes.map(attr => (
              <option key={attr.key} value={attr.key}>
                {attr.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">⚡ Loading optimized data...</p>
        </div>
      )}

      {!loading && slotData.length === 0 && (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">No equipment data available.</p>
        </div>
      )}

      {!loading && slotData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {slotData.map(({ slot, items }) => (
            <div key={slot} className="bg-gray-50 rounded-xl p-5 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center border-b-2 border-blue-500 pb-3">
                📦 {slot.charAt(0).toUpperCase() + slot.slice(1)} Slot
              </h2>

              <div className="flex flex-col gap-3">
                {items.map((item, index) => (
                  <div key={item.item_id} className={`bg-white rounded-lg p-4 border-l-4 transition-transform hover:translate-x-1 ${
                    index === 0 ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-white' :
                    index === 1 ? 'border-gray-400 bg-gradient-to-r from-gray-50 to-white' :
                    index === 2 ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-white' :
                    'border-blue-500'
                  }`}>
                    <div className="flex items-center mb-3">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold mr-3">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-gray-800 flex-1">{item.item_name}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">{attributes.find(a => a.key === selectedAttribute)?.label}:</span>
                        <span className="font-bold text-gray-800">{item.attribute_value}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Price:</span>
                        <span className="font-bold text-gray-800">{formatPrice(item.current_price)} gp</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Efficiency:</span>
                        <div className="flex items-center">
                          <span className="font-bold text-green-600 text-lg">{formatEfficiency(item.efficiency)}</span>
                          <span className="text-gray-500 text-xs ml-1">per gp</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}

export default OptimalItemsViewOptimized;
