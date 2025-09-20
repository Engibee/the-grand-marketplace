import { useState, useEffect } from "react";
import type { TopHealingFood } from "../types/api";

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

function OptimalConsumableView() {
  const [healingFoods, setHealingFoods] = useState<TopHealingFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState<number>(20);

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
