import { useState, useEffect } from "react";

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
}

export default function SearchBar({ query, setQuery }: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(localQuery); // só dispara após X ms
    }, 500); // ajuste o delay como preferir (500ms é padrão)

    return () => {
      clearTimeout(handler); // limpa o timeout se o usuário continuar digitando
    };
  }, [localQuery, setQuery]);

  return (
    <div className="flex justify-center font-serif text-shadow-2xs text-yellow-500">
      <input
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Search for an item..."
        className="border rounded p-2 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
