import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, Search, Edit2, Trash2, Star, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PermissionGuard from "../components/PermissionGuard";

export default function MedicamentosDatabase() {
  const navigate = useNavigate();
  const [medicamentos, setMedicamentos] = useState([]);
  const [filteredMedicamentos, setFilteredMedicamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    apresentacao: "",
    posologia: "",
    indicacao: "",
    via_administracao: "oral",
    observacoes: "",
    uso_frequente: false
  });

  useEffect(() => {
    loadMedicamentos();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = medicamentos.filter(med =>
        med.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (med.apresentacao && med.apresentacao.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredMedicamentos(filtered);
    } else {
      setFilteredMedicamentos(medicamentos);
    }
  }, [searchTerm, medicamentos]);

  const loadMedicamentos = async () => {
    setIsLoading(true);
    const { Medicamento } = await import("@/entities/Medicamento");
    const data = await Medicamento.list("-created_date");
    setMedicamentos(data);
    setFilteredMedicamentos(data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    const { Medicamento } = await import("@/entities/Medicamento");
    
    if (editingMed) {
      await Medicamento.update(editingMed.id, formData);
    } else {
      await Medicamento.create(formData);
    }
    
    setShowDialog(false);
    setEditingMed(null);
    setFormData({
      nome: "",
      apresentacao: "",
      posologia: "",
      indicacao: "",
      via_administracao: "oral",
      observacoes: "",
      uso_frequente: false
    });
    loadMedicamentos();
  };

  const handleEdit = (med) => {
    setEditingMed(med);
    setFormData({
      nome: med.nome || "",
      apresentacao: med.apresentacao || "",
      posologia: med.posologia || "",
      indicacao: med.indicacao || "",
      via_administracao: med.via_administracao || "oral",
      observacoes: med.observacoes || "",
      uso_frequente: med.uso_frequente || false
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este medicamento?")) return;
    
    const { Medicamento } = await import("@/entities/Medicamento");
    await Medicamento.delete(id);
    loadMedicamentos();
  };

  const handleNew = () => {
    setEditingMed(null);
    setFormData({
      nome: "",
      apresentacao: "",
      posologia: "",
      indicacao: "",
      via_administracao: "oral",
      observacoes: "",
      uso_frequente: false
    });
    setShowDialog(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="can_access_templates">
      <div className="p-4 md:p-8 bg-gradient-to-br from-pink-50 to-purple-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Home"))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Pill className="w-8 h-8 text-pink-600" />
                Banco de Medicamentos
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie medicamentos para autocomplete nas receitas
              </p>
            </div>
            <Button
              onClick={handleNew}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Medicamento
            </Button>
          </div>

          <Card className="mb-6 shadow-md border-none">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar medicamento por nome ou apresentação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {filteredMedicamentos.length === 0 ? (
            <Card className="shadow-md border-none">
              <CardContent className="p-12 text-center">
                <Pill className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? "Nenhum medicamento encontrado" : "Nenhum medicamento cadastrado"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? "Tente outro termo de busca" : "Comece adicionando medicamentos frequentes"}
                </p>
                {!searchTerm && (
                  <Button onClick={handleNew} className="bg-pink-600 hover:bg-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Medicamento
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredMedicamentos.map((med) => (
                <Card key={med.id} className="shadow-md border-none hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {med.uso_frequente && (
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          )}
                          {med.nome}
                        </CardTitle>
                        {med.apresentacao && (
                          <p className="text-sm text-gray-600 mt-1">{med.apresentacao}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(med)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(med.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {med.posologia && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Posologia:</p>
                        <p className="text-sm text-gray-700">{med.posologia}</p>
                      </div>
                    )}
                    {med.indicacao && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Indicação:</p>
                        <p className="text-sm text-gray-700">{med.indicacao}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Badge variant="outline" className="text-xs">
                        {med.via_administracao || "oral"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-pink-600" />
              {editingMed ? "Editar Medicamento" : "Novo Medicamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nome">Nome do Medicamento *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Dipirona"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="apresentacao">Apresentação</Label>
                <Input
                  id="apresentacao"
                  value={formData.apresentacao}
                  onChange={(e) => setFormData({...formData, apresentacao: e.target.value})}
                  placeholder="Ex: gotas 500mg/ml, comprimido 500mg"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="posologia">Posologia Padrão</Label>
                <Input
                  id="posologia"
                  value={formData.posologia}
                  onChange={(e) => setFormData({...formData, posologia: e.target.value})}
                  placeholder="Ex: 40 gotas a cada 6 horas"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="indicacao">Indicação</Label>
                <Input
                  id="indicacao"
                  value={formData.indicacao}
                  onChange={(e) => setFormData({...formData, indicacao: e.target.value})}
                  placeholder="Ex: se dor ou febre"
                />
              </div>

              <div>
                <Label htmlFor="via">Via de Administração</Label>
                <Select
                  value={formData.via_administracao}
                  onValueChange={(value) => setFormData({...formData, via_administracao: value})}
                >
                  <SelectTrigger id="via">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oral">Oral</SelectItem>
                    <SelectItem value="injetável">Injetável</SelectItem>
                    <SelectItem value="tópica">Tópica</SelectItem>
                    <SelectItem value="inalatória">Inalatória</SelectItem>
                    <SelectItem value="retal">Retal</SelectItem>
                    <SelectItem value="sublingual">Sublingual</SelectItem>
                    <SelectItem value="outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="frequente">Uso Frequente</Label>
                <Switch
                  id="frequente"
                  checked={formData.uso_frequente}
                  onCheckedChange={(checked) => setFormData({...formData, uso_frequente: checked})}
                />
                <Star className={`w-4 h-4 ${formData.uso_frequente ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              </div>

              <div className="col-span-2">
                <Label htmlFor="obs">Observações</Label>
                <Textarea
                  id="obs"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações adicionais sobre o medicamento"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.nome.trim()}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {editingMed ? "Salvar Alterações" : "Adicionar Medicamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}