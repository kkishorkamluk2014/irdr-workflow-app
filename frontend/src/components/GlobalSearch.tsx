import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface SearchResult {
  id: string;
  _type: "contract" | "export" | "warehouse" | "expense" | "shipment";
  [key: string]: any;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: string; path: string }
> = {
  contract: { label: "Import Contracts", icon: "📄", path: "/contracts" },
  export: { label: "Export Contracts", icon: "📤", path: "/contracts" },
  warehouse: { label: "Warehouses", icon: "🏭", path: "/warehouse" },
  expense: { label: "Expenses", icon: "💰", path: "/expenses" },
  shipment: { label: "Shipments", icon: "🚢", path: "/shipments" },
};

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  const doSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get<SearchResponse>("/search", {
        params: { q: searchQuery, limit: 20 },
      });
      setResults(data.results);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // Navigate to result — pass highlight params so the target page can focus the row
  const navigateToResult = (result: SearchResult) => {
    setIsOpen(false);
    const q = encodeURIComponent(query);
    const id = result.id;

    switch (result._type) {
      case "contract":
        navigate(`/contracts/${id}`);
        break;
      case "export":
        navigate(`/contracts?highlight=${id}&q=${q}`);
        break;
      case "warehouse":
        navigate(`/warehouse?highlight=${id}&q=${q}`);
        break;
      case "expense":
        navigate(`/expenses?highlight=${id}&q=${q}`);
        break;
      case "shipment":
        navigate(`/shipments?highlight=${id}&q=${q}`);
        break;
    }
  };

  // Keyboard navigation in results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigateToResult(results[selectedIndex]);
    }
  };

  // Get display text for a result
  const getResultTitle = (result: SearchResult): string => {
    switch (result._type) {
      case "contract":
        return result.importRefNumber || result.contractId || "Contract";
      case "export":
        return result.contractNo || result.buyer || "Export";
      case "warehouse":
        return result.name || result.code || "Warehouse";
      case "expense":
        return result.vendor || result.description || "Expense";
      case "shipment":
        return result.blNumber || result.vesselName || "Shipment";
      default:
        return "Result";
    }
  };

  const getResultSubtitle = (result: SearchResult): string => {
    switch (result._type) {
      case "contract":
        return [result.material, result.supplier, result.origin]
          .filter(Boolean)
          .join(" • ");
      case "export":
        return [result.commodity, result.buyer, result.finalDestination]
          .filter(Boolean)
          .join(" • ");
      case "warehouse":
        return [result.city, result.serviceProvider, result.agreementStatus]
          .filter(Boolean)
          .join(" • ");
      case "expense":
        return [
          result.expenseType,
          result.blNumber,
          result.amount ? `₹${Number(result.amount).toLocaleString()}` : "",
        ]
          .filter(Boolean)
          .join(" • ");
      case "shipment":
        return [result.vesselName, result.loadingPort, result.destinationPort]
          .filter(Boolean)
          .join(" → ");
      default:
        return "";
    }
  };

  if (!isOpen) {
    return (
      <button
        className="search-trigger"
        onClick={() => setIsOpen(true)}
        title="Search (Ctrl+K)"
      >
        🔍 <span className="search-trigger-text">Search...</span>
        <kbd className="search-kbd">Ctrl+K</kbd>
      </button>
    );
  }

  return (
    <div className="search-overlay" onClick={() => setIsOpen(false)}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search contracts, warehouses, expenses, shipments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="search-esc" onClick={() => setIsOpen(false)}>
            ESC
          </kbd>
        </div>

        <div className="search-results">
          {loading && (
            <div className="search-loading">
              <div className="search-spinner" />
              Searching...
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="search-empty">No results found for "{query}"</div>
          )}

          {!loading && results.length > 0 && (
            <div className="search-results-list">
              {results.map((result, index) => {
                const cfg = CATEGORY_CONFIG[result._type];
                return (
                  <button
                    key={`${result._type}-${result.id}`}
                    className={`search-result-item ${index === selectedIndex ? "selected" : ""}`}
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="search-result-icon">{cfg?.icon}</span>
                    <div className="search-result-content">
                      <div className="search-result-title">
                        {getResultTitle(result)}
                      </div>
                      <div className="search-result-subtitle">
                        {getResultSubtitle(result)}
                      </div>
                    </div>
                    <span className="search-result-badge">{cfg?.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="search-hint">
              Type at least 2 characters to search across all data
            </div>
          )}
        </div>

        <div className="search-footer">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
