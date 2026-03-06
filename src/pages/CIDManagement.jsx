import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Search, Star, Trash2, Plus, ArrowLeft, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PermissionGuard from "../components/PermissionGuard";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CIDManagement() {
  const navigate = useNavigate();
  const [cids, setCids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCid, setEditingCid] = useState(null);
  const [formData, setFormData] = useState({ codigo: "", descricao: "", categoria: "", restrito_sexo: "", causa_obito: false });

  useEffect(() => {
    loadCIDs();
  }, []);

  const loadCIDs = async () => {
    setLoading(true);
    const data = await base44.entities.CID.list("-uso_frequente", 5000);
    setCids(data);
    setLoading(false);
  };

  const [importProgress, setImportProgress] = useState("");

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = ""; // reset input

    setImporting(true);
    setImportProgress("Lendo arquivo...");
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const cidsToImport = [];

      // Detecta o header e os índices das colunas
      // Formato esperado: SUBCAT;CLASSIF;RESTRSEXO;CAUSAOBITO;DESCRICAO;...
      const headerLine = lines[0].trim();
      const headerParts = headerLine.split(';').map(h => h.trim().toUpperCase().replace(/[^A-Z]/g, ''));
      
      const idxSubcat = headerParts.findIndex(h => h === 'SUBCAT');
      const idxRestrsexo = headerParts.findIndex(h => h === 'RESTRSEXO');
      const idxCausaobito = headerParts.findIndex(h => h === 'CAUSAOBITO');
      const idxDescricao = headerParts.findIndex(h => h === 'DESCRICAO');

      // Fallback: se não encontrar header, assume posições fixas SUBCAT;CLASSIF;RESTRSEXO;CAUSAOBITO;DESCRICAO
      const useHeader = idxSubcat !== -1 && idxDescricao !== -1;
      const colSubcat    = useHeader ? idxSubcat    : 0;
      const colRestrsexo = useHeader ? idxRestrsexo : 2;
      const colCausaobito= useHeader ? idxCausaobito: 3;
      const colDescricao = useHeader ? idxDescricao : 4;

      const startLine = useHeader ? 1 : 0;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(';').map(p => p.trim().replace(/^"|"$/g, ''));

        const codigo = parts[colSubcat]?.trim() || "";
        const descricao = parts[colDescricao]?.trim() || "";
        const restrsexo = parts[colRestrsexo]?.trim().toUpperCase() || "";
        const causaobito = parts[colCausaobito]?.trim() || "";

        if (!codigo || !descricao) continue;

        const restrito_sexo = restrsexo === "M" ? "M" : restrsexo === "F" ? "F" : "";
        const causa_obito = causaobito === "1" || causaobito.toLowerCase() === "sim" || causaobito.toLowerCase() === "true";

        cidsToImport.push({ codigo, descricao, restrito_sexo, causa_obito });
      }

      if (cidsToImport.length === 0) {
        alert("Nenhum CID válido encontrado no arquivo.");
        setImporting(false);
        setImportProgress("");
        return;
      }

      // Importação em lotes de 500 para suportar 13mil+ registros
      const BATCH_SIZE = 500;
      let imported = 0;
      for (let i = 0; i < cidsToImport.length; i += BATCH_SIZE) {
        const batch = cidsToImport.slice(i, i + BATCH_SIZE);
        await base44.entities.CID.bulkCreate(batch);
        imported += batch.length;
        setImportProgress(`Importando... ${imported} de ${cidsToImport.length}`);
      }

      await loadCIDs();
      alert(`${cidsToImport.length} CIDs importados com sucesso!`);
    } catch (error) {
      alert("Erro ao importar arquivo: " + error.message);
    }
    setImporting(false);
    setImportProgress("");
  };

  const handleSave = async () => {
    if (!formData.codigo || !formData.descricao) {
      alert("Código e descrição são obrigatórios");
      return;
    }

    if (editingCid) {
      await base44.entities.CID.update(editingCid.id, formData);
    } else {
      await base44.entities.CID.create(formData);
    }
    await loadCIDs();
    setShowAddDialog(false);
    setEditingCid(null);
    setFormData({ codigo: "", descricao: "", categoria: "", restrito_sexo: "", causa_obito: false });
  };

  const handleEdit = (cid) => {
    setEditingCid(cid);
    setFormData({
      codigo: cid.codigo || "",
      descricao: cid.descricao || "",
      categoria: cid.categoria || "",
      restrito_sexo: cid.restrito_sexo || "",
      causa_obito: cid.causa_obito || false,
    });
    setShowAddDialog(true);
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
            <h1 className="text-3xl font-bold text-gray-900">CIDs Cadastrados</h1>
            <p className="text-gray-600 mt-1">Consulte e gerencie a base de dados CID-10</p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            {/* Import Actions */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div>
                <input
                  type="file"
                  accept=".csv,.txt"
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
                  {importProgress || "Importando CIDs... Isso pode levar alguns minutos."}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-blue-600">{cid.codigo}</span>
                      {cid.uso_frequente && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                      {cid.restrito_sexo && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cid.restrito_sexo === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                          {cid.restrito_sexo === 'M' ? 'Masculino' : 'Feminino'}
                        </span>
                      )}
                      {cid.causa_obito && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-700">Causa de Óbito</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{cid.descricao}</p>
                    {cid.categoria && (
                      <p className="text-xs text-gray-500 mt-1">{cid.categoria}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleFavorite(cid)}>
                      <Star className={`w-4 h-4 ${cid.uso_frequente ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(cid)}>
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cid.id)}>
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

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) { setEditingCid(null); setFormData({ codigo: "", descricao: "", categoria: "", restrito_sexo: "", causa_obito: false }); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCid ? "Editar CID" : "Adicionar Novo CID"}</DialogTitle>
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
              <div>
                <Label>Restrito ao Sexo</Label>
                <div className="flex gap-3 mt-1">
                  {[{ label: "Sem Restrição", value: "" }, { label: "Masculino (M)", value: "M" }, { label: "Feminino (F)", value: "F" }].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="restrito_sexo"
                        value={opt.value}
                        checked={formData.restrito_sexo === opt.value}
                        onChange={() => setFormData({ ...formData, restrito_sexo: opt.value })}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Causa de Óbito</Label>
                <div className="flex gap-3 mt-1">
                  {[{ label: "Não", value: false }, { label: "Sim", value: true }].map((opt) => (
                    <label key={String(opt.value)} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="causa_obito"
                        checked={formData.causa_obito === opt.value}
                        onChange={() => setFormData({ ...formData, causa_obito: opt.value })}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingCid(null); setFormData({ codigo: "", descricao: "", categoria: "", restrito_sexo: "", causa_obito: false }); }}>
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