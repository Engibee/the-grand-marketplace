import { useState, useEffect } from "react";
import ItemCard from "../components/ItemCard";
import SearchBar from "../components/SearchBar";
import type { ApiItem } from "../types/api";

function MarketplaceView() {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [query, setQuery] = useState("");

  // Busca na API do backend
  useEffect(() => {
    if (!query) return;

    const fetchItems = async () => {
      try {
        const res = await fetch(
          `${__API_URL__}/items/search?name=${query}`
        );
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error("Error trying to find item:", err);
      }
    };

    fetchItems();
  }, [query]);

  return (
    <div>
      <SearchBar query={query} setQuery={setQuery} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default MarketplaceView;
