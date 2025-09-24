import { useState, useEffect } from "react";
import type { TopHealingFood } from "../types/api";

// Special consumables that heal based on HP level
interface SpecialConsumable {
  item_id: number;
  item_name: string;
  current_price: string;
  calculateHealing: (currentHP: number) => number;
}

// Interface for item search results
interface ItemSearchResult {
  id: number;
  name: string;
  current_price: string;
  [key: string]: unknown;
}

// Special consumables data - healing formulas to be implemented by you!
const SPECIAL_CONSUMABLES: SpecialConsumable[] = [
  {
    item_id: 6685, // Saradomin brew (4) - placeholder ID
    item_name: "Saradomin brew (4)",
    current_price: "0", // Will be fetched from API
    calculateHealing: (currentHP: number) => {
      return Math.floor((currentHP * 0.15) + 2);
    }
  },
  {
    item_id: 5982, // Watermelon slice - placeholder ID
    item_name: "Watermelon slice",
    current_price: "0", // Will be fetched from API
    calculateHealing: (currentHP: number) => {
      return Math.floor((currentHP * 0.05) + 1);
    }
  },
  {
    item_id: 5504, // Strawberry - placeholder ID
    item_name: "Strawberry",
    current_price: "0", // Will be fetched from API
    calculateHealing: (currentHP: number) => {

      return Math.floor((currentHP * 0.06) + 1);
    }
  }
];

// Global cache for healing foods data
let healingFoodsCache: TopHealingFood[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check if cache is valid
const isCacheValid = (): boolean => {
  return healingFoodsCache !== null && (Date.now() - cacheTimestamp) < CACHE_DURATION;
};

// Fetch healing foods data from API or cache
const fetchHealingFoods = async (limit: number = 20): Promise<TopHealingFood[]> => {
  // Return cached data if valid and limit matches
  if (isCacheValid() && healingFoodsCache!.length >= limit) {
    console.log("📦 Using cached healing foods data");
    return healingFoodsCache!.slice(0, limit);
  }

  console.log("🌐 Fetching fresh healing foods data from API");
  const res = await fetch(`${__API_URL__}/consumables/healing/top?limit=${limit}`);
  const data: TopHealingFood[] = await res.json();

  // Update cache
  healingFoodsCache = data;
  cacheTimestamp = Date.now();

  return data;
};

// Fetch prices for special consumables
const fetchSpecialConsumablePrices = async (): Promise<SpecialConsumable[]> => {
  try {
    const updatedConsumables = await Promise.all(
      SPECIAL_CONSUMABLES.map(async (consumable) => {
        try {
          // Try to fetch price by item ID first (more reliable)
          console.log(`🔍 Fetching price for ${consumable.item_name} (ID: ${consumable.item_id})`);
          const res = await fetch(`${__API_URL__}/items/${consumable.item_id}`);

          if (res.ok) {
            const item = await res.json();
            console.log(`✅ Found item by ID:`, item);
            return {
              ...consumable,
              current_price: item?.current_price || "0",
              item_name: item?.name || consumable.item_name // Update name if found
            };
          } else {
            // Fallback to search by name if ID fetch fails
            console.warn(`❌ Item ID ${consumable.item_id} not found (status: ${res.status}), trying name search...`);
            const searchRes = await fetch(`${__API_URL__}/items/search?name=${encodeURIComponent(consumable.item_name)}`);
            const items: ItemSearchResult[] = await searchRes.json();
            console.log(`🔍 Search results for "${consumable.item_name}":`, items);

            // Find exact match or first result
            const matchedItem = items.find((item: ItemSearchResult) =>
              item.name.toLowerCase() === consumable.item_name.toLowerCase()
            ) || items[0];

            console.log(`📝 Selected item:`, matchedItem);

            return {
              ...consumable,
              current_price: matchedItem?.current_price || "0",
              item_id: matchedItem?.id || consumable.item_id
            };
          }
        } catch (error) {
          console.warn(`❌ Failed to fetch price for ${consumable.item_name}:`, error);
          return consumable;
        }
      })
    );

    return updatedConsumables;
  } catch (error) {
    console.error("Error fetching special consumable prices:", error);
    return SPECIAL_CONSUMABLES;
  }
};

function OptimalConsumableView() {
  const [healingFoods, setHealingFoods] = useState<TopHealingFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState<number>(20);

  // Special consumables state
  const [currentHP, setCurrentHP] = useState<number>(99);
  const [specialConsumables, setSpecialConsumables] = useState<SpecialConsumable[]>(SPECIAL_CONSUMABLES);
  const [specialLoading, setSpecialLoading] = useState(false);

  // Load special consumables prices
  useEffect(() => {
    const loadSpecialConsumables = async () => {
      setSpecialLoading(true);
      try {
        const data = await fetchSpecialConsumablePrices();
        setSpecialConsumables(data);
      } catch (err) {
        console.error("Error fetching special consumables data:", err);
      } finally {
        setSpecialLoading(false);
      }
    };

    loadSpecialConsumables();
  }, []);

  // Load healing foods data
  useEffect(() => {
    const loadHealingFoods = async () => {
      setLoading(true);
      try {
        const data = await fetchHealingFoods(selectedLimit);
        setHealingFoods(data);
      } catch (err) {
        console.error("Error fetching healing foods data:", err);
        setHealingFoods([]);
      } finally {
        setLoading(false);
      }
    };

    loadHealingFoods();
  }, [selectedLimit]);

  // Calculate efficiency for special consumables
  const calculateSpecialEfficiency = (consumable: SpecialConsumable, hp: number): number => {
    const healing = consumable.calculateHealing(hp);
    const price = parseInt(consumable.current_price) || 1;

    // If healing is 0 (formula not implemented), return 0
    if (healing === 0) return 0;

    return healing / price;
  };

  // Check if a consumable has its formula implemented
  const isFormulaImplemented = (consumable: SpecialConsumable, hp: number): boolean => {
    return consumable.calculateHealing(hp) > 0;
  };

  // Helper function to format efficiency values
  const formatEfficiency = (efficiency: number): string => {
    if (efficiency >= 1) {
      return efficiency.toFixed(3);
    } else {
      return efficiency.toFixed(6);
    }
  };

  // Helper function to format prices
  const formatPrice = (price: string): string => {
    const num = parseInt(price);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M gp`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K gp`;
    }
    return `${num.toLocaleString()} gp`;
  };

  return (
    <div>
      {/* Special HP-Based Consumables Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-purple-500 mb-4">
          ⚗️ Special HP-Based Healing Consumables
        </h2>
        <p className="text-gray-300 mb-4">
          Consumables with healing that depends on your current HP level. Enter your current HP to see dynamic efficiency calculations.
        </p>

        {/* HP Input */}
        <div className="mb-6">
          <label className="text-gray-300 mr-3">Current HP:</label>
          <input
            type="number"
            min="1"
            max="99"
            value={currentHP}
            onChange={(e) => setCurrentHP(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
            className="bg-[#2A2419] text-yellow-400 border border-gray-600 rounded px-3 py-2 w-20"
          />
          <span className="text-gray-400 ml-2">/ 99❤️</span>
        </div>

        {specialLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-purple-500 text-lg">Loading special consumables...</div>
          </div>
        ) : (
          <div className="bg-[#332B21] rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialConsumables.map((consumable) => {
                const healing = consumable.calculateHealing(currentHP);
                const efficiency = calculateSpecialEfficiency(consumable, currentHP);
                const price = parseInt(consumable.current_price) || 0;
                const formulaImplemented = isFormulaImplemented(consumable, currentHP);

                return (
                  <div
                    key={consumable.item_id}
                    className={`bg-[#2A2419] rounded-lg p-4 border transition-colors ${
                      formulaImplemented
                        ? 'border-purple-600 hover:border-purple-400'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {/* Special badge */}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-white text-xs font-bold px-2 py-1 rounded ${
                        formulaImplemented ? 'bg-purple-500' : 'bg-gray-500'
                      }`}>
                        {formulaImplemented ? 'HP-BASED' : 'NEEDS FORMULA'}
                      </span>
                      <span className="text-xs text-gray-400">
                        @ {currentHP} HP
                      </span>
                    </div>

                    {/* Item name */}
                    <h4 className={`font-semibold mb-2 text-sm ${
                      formulaImplemented ? 'text-purple-400' : 'text-gray-400'
                    }`}>
                      {consumable.item_name}
                    </h4>

                    {/* Stats */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Healing:</span>
                        <span className={`font-semibold ${
                          formulaImplemented ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          {formulaImplemented ? `${healing} HP` : 'Formula needed'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-300">Price:</span>
                        <span className="text-yellow-300">
                          {price > 0 ? formatPrice(consumable.current_price) : "Loading..."}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-300">HP per GP:</span>
                        <span className={`font-semibold ${
                          formulaImplemented && price > 0 ? 'text-blue-400' : 'text-gray-500'
                        }`}>
                          {formulaImplemented && price > 0 ? formatEfficiency(efficiency) : 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-300">Status:</span>
                        <span className={`text-xs ${
                          formulaImplemented ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formulaImplemented ? 'Ready' : 'Implement formula'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Regular Healing Foods Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-yellow-500 mb-4">
          🍖 Most Cost-Efficient Healing Foods
        </h2>
        <p className="text-gray-300 mb-4">
          Top healing foods ranked by healing per GP (most cost-efficient healing).
        </p>

        {/* Limit selector */}
        <div className="mb-4">
          <label className="text-gray-300 mr-3">Show top:</label>
          <select
            value={selectedLimit}
            onChange={(e) => setSelectedLimit(Number(e.target.value))}
            className="bg-[#2A2419] text-yellow-400 border border-gray-600 rounded px-3 py-1"
          >
            <option value={10}>10 foods</option>
            <option value={20}>20 foods</option>
            <option value={30}>30 foods</option>
            <option value={50}>50 foods</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-yellow-500 text-lg">Loading healing foods data...</div>
        </div>
      ) : healingFoods.length > 0 ? (
        <div className="bg-[#332B21] rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {healingFoods.map((food, index) => (
              <div
                key={food.item_id}
                className="bg-[#2A2419] rounded-lg p-4 border border-gray-600 hover:border-yellow-500 transition-colors"
              >
                {/* Rank badge */}
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                  <span className="text-xs text-gray-400">
                    {food.bites} bite{food.bites !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Item name */}
                <h4 className="text-yellow-400 font-semibold mb-2 text-sm">
                  {food.item_name}
                </h4>

                {/* Stats */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Healing:</span>
                    <span className="text-green-400 font-semibold">{food.healing} HP</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">Price:</span>
                    <span className="text-yellow-300">{formatPrice(food.current_price)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">HP per GP:</span>
                    <span className="text-blue-400 font-semibold">
                      {formatEfficiency(food.healing_per_gp)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">HP per bite:</span>
                    <span className="text-purple-400">{food.healing_per_bite}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No healing foods data available.</div>
        </div>
      )}
    </div>
  );
}

export default OptimalConsumableView;
