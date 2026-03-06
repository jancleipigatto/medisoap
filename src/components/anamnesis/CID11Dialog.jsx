import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Plus } from "lucide-react";
import { icd11Search } from "@/functions/icd11Search";

export default function CID11Dialog({ open, onOpenChange, onAdd }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [added, setAdded] = useState({});
  const debounceRef = useRef(null);

  const handleSearch = async (value) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      const res = await icd11Search({ query: value, language: "pt" });
      setResults(res.data?.results || []);
      setLoading(false);
    }, 400);
  };

  const handleAdd = (entity) => {
    const code = entity.code || entity.id?.split("/").pop() || "";
    const text = code ? `${code} - ${entity.title}` : entity.title;
    onAdd(text);
    setAdded(prev => ({ ...prev, [entity.id]: true }));
  };

  const handleClose = (v) => {
    onOpenChange(v);
    if (!v) {
      setQuery("");
      setResults([]);
      setSearched(false);
      setAdded({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Incluir CID-11 — Busca OMS</DialogTitle>
        </DialogHeader>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Digite o nome da doença ou código (ex: diabetes, hipertensão)..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 text-sm"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto space-y-2">
          {!searched && (
            <div className="text-center py-12 text-gray-400 text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Digite para buscar na base ICD-11 da OMS</p>
            </div>
          )}

          {searched && !loading && results.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Nenhum resultado para "<strong>{query}</strong>"
            </div>
          )}

          {results.map((entity) => (
            <div key={entity.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {entity.code && (
                    <Badge className="font-mono bg-indigo-100 text-indigo-700 border-0 text-xs">
                      {entity.code}
                    </Badge>
                  )}
                  {entity.isLeaf && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                      Código final
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900">{entity.title}</p>
                {entity.definition && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{entity.definition}</p>
                )}
              </div>
              <Button
                size="sm"
                variant={added[entity.id] ? "secondary" : "outline"}
                onClick={() => handleAdd(entity)}
                disabled={added[entity.id]}
                className="shrink-0"
              >
                {added[entity.id] ? (
                  "Incluído ✓"
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    Incluir
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}