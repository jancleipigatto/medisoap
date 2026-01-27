import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Search, Star, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PermissionGuard from "../components/PermissionGuard";

export default function CIDManagement() {
  const [cids, setCids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({ codigo: "", descricao: "", categoria: "" });

  useEffect(() => {
    loadCIDs();
  }, []);

  const loadCIDs = async () => {
    setLoading(true);
    const data = await base44.entities.CID.list("-uso_frequente", 5000);
    setCids(data);
    setLoading(false);
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      // Se for arquivo .txt, fazer parse manual
      if (fileExtension === 'txt') {
        const text = await file.text();
        const lines = text.split('\n');
        const cidsToImport = [];

        // Parse do formato: "code"; "description"
        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith('"code"')) continue; // Pula header e linhas vazias
          
          // Separa por ponto e vírgula
          const parts = line.split(';').map(p => p.trim().replace(/^"|"$/g, ''));
          
          if (parts.length >= 2) {
            const codigo = parts[0].trim();
            const descricao = parts[1].trim();
            
            if (codigo && descricao) {
              cidsToImport.push({ codigo, descricao });
            }
          }
        }

        if (cidsToImport.length > 0) {
          await base44.entities.CID.bulkCreate(cidsToImport);
          await loadCIDs();
          alert(`${cidsToImport.length} CIDs importados com sucesso!`);
        } else {
          alert("Nenhum CID válido encontrado no arquivo");
        }
      } else {
        // Para CSV/XLSX usar a integração
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    codigo: { type: "string" },
                    descricao: { type: "string" },
                    categoria: { type: "string" }
                  }
                }
              }
            }
          }
        });

        if (result.status === "success" && result.output?.items) {
          await base44.entities.CID.bulkCreate(result.output.items);
          await loadCIDs();
          alert("CIDs importados com sucesso!");
        }
      }
    } catch (error) {
      alert("Erro ao importar arquivo: " + error.message);
    }
    setImporting(false);
  };

  const handleSave = async () => {
    if (!formData.codigo || !formData.descricao) {
      alert("Código e descrição são obrigatórios");
      return;
    }

    await base44.entities.CID.create(formData);
    await loadCIDs();
    setShowAddDialog(false);
    setFormData({ codigo: "", descricao: "", categoria: "" });
  };

  const toggleFavorite = async (cid) => {
    await base44.entities.CID.update(cid.id, { uso_frequente: !cid.uso_frequente });
    await loadCIDs();
  };

  const handleDelete = async (id) => {
    if (confirm("Deseja realmente excluir este CID?")) {
      await base44.entities.CID.delete(id);
      await loadCIDs();
    }
  };

  const filteredCIDs = cids
    .filter(
      (cid) =>
        cid.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cid.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Ordenar por código completo (A00, A01, A011, A02, etc)
      return a.codigo.localeCompare(b.codigo, undefined, { numeric: true });
    });

  if (loading) {
    return (
      <PermissionGuard permission="can_access_templates">
        <div className="p-8">
          <Skeleton className="h-32 mb-4" />
          <Skeleton className="h-64" />
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="can_access_templates">
      <div className="p-8 max-w-7xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-2xl">Banco de CIDs</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Import Actions */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.txt"
                  onChange={handleFileImport}
                  className="hidden"
                  id="file-upload"
                  disabled={importing}
                />
                <label htmlFor="file-upload">
                  <Button asChild disabled={importing}>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      {importing ? "Importando..." : "Importar Arquivo"}
                    </span>
                  </Button>
                </label>
              </div>

              <Button onClick={() => setShowAddDialog(true)} className="ml-auto">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar CID
              </Button>
            </div>

            {importing && (
              <Alert className="mb-4">
                <AlertDescription>
                  Importando CIDs... Isso pode levar alguns minutos.
                </AlertDescription>
              </Alert>
            )}

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por código ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* CIDs List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredCIDs.map((cid) => (
                <div
                  key={cid.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600">{cid.codigo}</span>
                      {cid.uso_frequente && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <p className="text-sm text-gray-700">{cid.descricao}</p>
                    {cid.categoria && (
                      <p className="text-xs text-gray-500 mt-1">{cid.categoria}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(cid)}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          cid.uso_frequente ? "text-yellow-500 fill-yellow-500" : "text-gray-400"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cid.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredCIDs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Nenhum CID encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo CID</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Código *</Label>
                <Input
                  placeholder="Ex: A00, B01.1"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição *</Label>
                <Input
                  placeholder="Descrição da doença"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  placeholder="Categoria ou capítulo"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}