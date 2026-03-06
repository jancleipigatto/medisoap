import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TemplatePickerDialog({ open, onOpenChange, templates, onSelect, selectedId }) {
  const [search, setSearch] = useState("");
  const [localTemplates, setLocalTemplates] = useState(null);

  // Use local copy to allow toggling favorites without reloading
  const list = localTemplates || templates;

  const filtered = list.filter(t =>
    t.nome.toLowerCase().includes(search.toLowerCase()) ||
    (t.descricao || "").toLowerCase().includes(search.toLowerCase())
  );

  // Sort: favorites first
  const sorted = [...filtered].sort((a, b) => (b.uso_frequente ? 1 : 0) - (a.uso_frequente ? 1 : 0));

  const toggleFavorite = async (template, e) => {
    e.stopPropagation();
    const updated = { ...template, uso_frequente: !template.uso_frequente };
    await base44.entities.AnamnesisTemplate.update(template.id, { uso_frequente: updated.uso_frequente });
    const base = localTemplates || templates;
    setLocalTemplates(base.map(t => t.id === template.id ? updated : t));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSearch(""); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Selecionar Modelo de Atendimento</DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar modelo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
          {/* Option: no template */}
          <button
            onClick={() => { onSelect(null); onOpenChange(false); }}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
              !selectedId ? "bg-blue-50 border-blue-300 font-medium" : "border-transparent hover:bg-gray-50"
            }`}
          >
            <span className="text-gray-500 italic">Sem modelo (usar padrão)</span>
          </button>

          {sorted.map(t => (
            <button
              key={t.id}
              onClick={() => { onSelect(t); onOpenChange(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors group ${
                selectedId === t.id
                  ? "bg-blue-50 border-blue-300"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">{t.nome}</span>
                    {t.is_medisoap_public && <span className="text-xs text-blue-500">🌐</span>}
                    {t.is_public_org && !t.is_medisoap_public && <span className="text-xs text-green-500">👥</span>}
                  </div>
                  {t.descricao && <p className="text-xs text-gray-500 truncate mt-0.5">{t.descricao}</p>}
                </div>
                <button
                  onClick={(e) => toggleFavorite(t, e)}
                  className="p-1 rounded hover:bg-yellow-50 transition-colors shrink-0"
                  title={t.uso_frequente ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Star className={`w-4 h-4 ${t.uso_frequente ? "fill-yellow-400 text-yellow-400" : "text-gray-300 group-hover:text-gray-400"}`} />
                </button>
              </div>
            </button>
          ))}

          {sorted.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhum modelo encontrado</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}