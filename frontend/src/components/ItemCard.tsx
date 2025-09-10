// components/ItemCard.tsx
import { useState } from "react";
import type { ApiItem } from "../types/api";

interface Props {
  item: ApiItem;
}

// map of exceptions (API name → Wiki filename)
const imageExceptions: Record<string, string> = {
  "Crystal 2h axe": "Crystal_felling_axe.png",
  "Crystal 2h axe (inactive)": "Crystal_felling_axe_(inactive).png",
};

export default function ItemCard({ item }: Props) {
  const baseIcon = item.icon.replace(/ /g, "_");
  const [imgSrc, setImgSrc] = useState(
    `https://oldschool.runescape.wiki/images/${
      imageExceptions[item.name] ?? baseIcon
    }`
  );

  const handleError = () => {
    // Uses exceptions
    if (imageExceptions[item.name] && !imgSrc.includes(imageExceptions[item.name])) {
      setImgSrc(`https://oldschool.runescape.wiki/images/${imageExceptions[item.name]}`);
      return;
    }

    // Tries _1 if sprite has multiple versions
    if (!imgSrc.includes("_1.png")) {
      const baseName = baseIcon.replace(/\.png$/, "");
      setImgSrc(`https://oldschool.runescape.wiki/images/${baseName}_1.png`);
    } else {
      console.error(`Unable to load the image of ${item.name}`);
    }
  };

  return (
    <div className="bg-[#332B21] rounded shadow p-4 flex flex-col items-center font-serif text-shadow-2xs text-yellow-500">
      <img
        src={imgSrc}
        alt={item.name}
        className="mb-2"
        onError={handleError}
      />
      <h2 className="font-bold">{item.name}</h2>
      <p>Price: {Number(item.current_price)?.toLocaleString() ?? "N/A"} gp</p>
      <p>Tendency: {item.current_trend ?? "N/A"}</p>
      <p>Volume: {Number(item.volume)?.toLocaleString() ?? "N/A"}</p>
    </div>
  );
}
