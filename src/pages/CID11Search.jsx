import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { icd11Search } from "@/functions/icd11Search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Loader2, Star } from "lucide-react";
import PermissionGuard from "../components/PermissionGuard";

export default function CID11Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
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

  const handleSaveLocal = async (entity) => {
    if (saving[entity.id] || saved[entity.id]) return;
    setSaving(prev => ({ ...prev, [entity.id]: true }));
    try {
      await base44.entities.CID.create({
        codigo: entity.code || entity.id?.split("/").pop() || "",
        descricao: entity.title,
        categoria: "",
        restrito_sexo: "",
        causa_obito: false,
        uso_frequente: false,
      });
      setSaved(prev => ({ ...prev, [entity.id]: true }));
    } catch (e) {
      alert("Erro ao salvar: " + e.message);
    }
    setSaving(prev => ({ ...prev, [entity.id]: false }));
  };

  return (
    <PermissionGuard permission="can_access_templates">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
            className="shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CIDs 11ª — Busca OMS</h1>
            <p className="text-sm text-gray-500 mt-0.5">Pesquise na classificação internacional de doenças ICD-11 em tempo real</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Digite o nome da doença ou código (ex: diabetes, hipertensão, A00)..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 text-base"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
          )}
        </div>

        {!searched && (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Digite para buscar na base ICD-11 da OMS</p>
            <p className="text-sm mt-1">Resultados em português</p>
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Nenhum resultado encontrado para "<strong>{query}</strong>"</p>
          </div>
        )}

        <div className="space-y-2">
          {results.map((entity) => (
            <Card key={entity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {entity.code && (
                        <Badge className="font-mono bg-blue-100 text-blue-700 border-0">
                          {entity.code}
                        </Badge>
                      )}
                      {entity.isLeaf && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                          Código final
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{entity.title}</p>
                    {entity.definition && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{entity.definition}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={saved[entity.id] ? "secondary" : "outline"}
                    onClick={() => handleSaveLocal(entity)}
                    disabled={saving[entity.id] || saved[entity.id]}
                    className="shrink-0"
                  >
                    {saving[entity.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved[entity.id] ? (
                      <>
                        <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                        Salvo
                      </>
                    ) : (
                      "Salvar localmente"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PermissionGuard>
  );
}