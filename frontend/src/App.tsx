import { useState } from "react";
import { MarketplaceView, OptimalItemsView } from "./views";

type ViewType = "search" | "optimal";

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("search");
  const renderCurrentView = () => {
    switch (currentView) {
      case "search":
        return <MarketplaceView />;
      case "optimal":
        return <OptimalItemsView />;
      default:
        return <MarketplaceView />;
    }
  };

  return (
    <div className="min-h-screen min-w-screen bg-[#3F3529] p-8">
      <h1 className="text-4xl font-serif text-shadow-2xs text-yellow-500 text-center mb-8">
        OSRS Marketplace
      </h1>
      <div className="w-[100%] h-[10%] mb-[1%] bg-[#332B21] max-w-6xl mx-auto p-4 rounded-lg">
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setCurrentView("search")}
            className={`!bg-[#3F3529] px-6 py-2 rounded-md font-medium transition-colors ${
              currentView === "search"
                ? "!bg-yellow-600 text-white"
                : "!bg-[#3F3529] text-gray-200 hover:!bg-gray-500"
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setCurrentView("optimal")}
            className={`!bg-[#3F3529] px-6 py-2 rounded-md font-medium transition-colors ${
              currentView === "optimal"
                ? "!bg-yellow-600 text-white"
                : "!bg-[#3F3529] text-gray-200 hover:!bg-gray-500"
            }`}
          >
            Optimal Items
          </button>
        </div>
      </div>
      {renderCurrentView()}
    </div>
  );
}

export default App;
