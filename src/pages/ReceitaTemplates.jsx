import React, { useState, useEffect } from "react";
import { ReceitaTemplate } from "@/entities/ReceitaTemplate";
import { UploadFile } from "@/integrations/Core";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Edit, Pill, Loader2, Image as ImageIcon, Star, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PermissionGuard from "../components/PermissionGuard";

export default function ReceitaTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [medicamentos, setMedicamentos] = useState([]);
  const [showMedicamentos, setShowMedicamentos] = useState(false);
  const [selectedMedicamentos, setSelectedMedicamentos] = useState([]);
  const [searchMedicamento, setSearchMedicamento] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    template_texto: "",
    cabecalho: "",
    rodape: "",
    logo_url: "",
    is_default: false,
    orientacoes: ""
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (searchMedicamento.length >= 2) {
      const timer = setTimeout(() => {
        searchMedicamentos(searchMedicamento);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setMedicamentos([]);
    }
  }, [searchMedicamento]);

  const loadTemplates = async () => {
    const data = await ReceitaTemplate.list("-created_date");
    setTemplates(data);
  };

  const searchMedicamentos = async (searchTerm) => {
    try {
      setIsSearching(true);
      const { Medicamento } = await import("@/entities/Medicamento");
      const allMedicamentos = await Medicamento.list("-created_date");
      const filtered = allMedicamentos.filter(med => 
        med.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setMedicamentos(filtered);
      setIsSearching(false);
    } catch (error) {
      console.error("Erro ao buscar medicamentos:", error);
      setIsSearching(false);
    }
  };

  const addMedicamento = (med) => {
    const newMed = {
      id: Date.now(),
      nome: med.nome,
      posologia: med.posologia || '',
      via_administracao: med.via_administracao || 'oral'
    };
    setSelectedMedicamentos([...selectedMedicamentos, newMed]);
  };

  const removeMedicamento = (id) => {
    setSelectedMedicamentos(selectedMedicamentos.filter(m => m.id !== id));
  };

  const updateMedicamento = (id, field, value) => {
    setSelectedMedicamentos(selectedMedicamentos.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const generateReceitaText = () => {
    const grouped = selectedMedicamentos.reduce((acc, med) => {
      const via = med.via_administracao || 'oral';
      if (!acc[via]) acc[via] = [];
      acc[via].push(med);
      return acc;
    }, {});

    const viaLabels = {
      oral: 'USO ORAL',
      injetável: 'USO INJETÁVEL',
      tópica: 'USO TÓPICO',
      inalatória: 'USO INALATÓRIO',
      retal: 'USO RETAL',
      sublingual: 'USO SUBLINGUAL',
      outra: 'OUTROS'
    };

    let text = '';
    Object.entries(grouped).forEach(([via, meds]) => {
      text += `${viaLabels[via] || via.toUpperCase()}:\n\n`;
      meds.forEach(med => {
        text += `${med.nome}\n${med.posologia}\n\n`;
      });
      text += '\n';
    });

    return text.trim();
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData(template);
    setSelectedMedicamentos([]);
    setShowForm(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const result = await UploadFile({ file });
    setFormData({ ...formData, logo_url: result.file_url });
    setIsUploading(false);
  };

  const handleSubmit = async () => {
    const receitaText = selectedMedicamentos.length > 0 ? generateReceitaText() : formData.template_texto;
    
    if (!formData.nome || (!receitaText && !formData.template_texto)) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    if (formData.is_default) {
      const currentDefault = templates.find(t => t.is_default && t.id !== editingTemplate?.id);
      if (currentDefault) {
        await ReceitaTemplate.update(currentDefault.id, { is_default: false });
      }
    }

    const dataToSave = {
      ...formData,
      template_texto: receitaText
    };

    if (editingTemplate) {
      await ReceitaTemplate.update(editingTemplate.id, dataToSave);
    } else {
      await ReceitaTemplate.create(dataToSave);
    }

    setShowForm(false);
    setEditingTemplate(null);
    setSelectedMedicamentos([]);
    setFormData({
      nome: "",
      template_texto: "",
      cabecalho: "",
      rodape: "",
      logo_url: "",
      is_default: false,
      orientacoes: ""
    });
    loadTemplates();
  };

  const handleDelete = async () => {
    await ReceitaTemplate.delete(deleteConfirm.id);
    setDeleteConfirm(null);
    loadTemplates();
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setSelectedMedicamentos([]);
    setFormData({
      nome: "",
      template_texto: "",
      cabecalho: "",
      rodape: "",
      logo_url: "",
      is_default: false,
      orientacoes: ""
    });
  };

  return (
    <PermissionGuard permission="can_access_templates">
      <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Home"))}
              className="shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Modelos de Receita</h1>
              <p className="text-gray-600 mt-1">Gerencie seus modelos de receita médica</p>
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Modelo
            </Button>
          </div>

          {templates.length === 0 ? (
            <Card className="shadow-lg border-none">
              <CardContent className="p-12 text-center">
                <Pill className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum modelo criado</h3>
                <p className="text-gray-500 mb-6">Crie seu primeiro modelo de receita</p>
                <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Primeiro Modelo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="shadow-lg border-none hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {template.nome}
                          {template.is_default && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </CardTitle>
                        {template.is_default && (
                          <CardDescription className="text-xs text-yellow-600 mt-1">
                            Modelo Padrão
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(template)}
                          className="hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(template)}
                          className="hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                      {template.template_texto}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Modelo" : "Novo Modelo de Receita"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nome">Nome do Modelo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Receita Padrão"
              />
            </div>

            <div>
              <Label className="mb-2 block">Medicamentos</Label>
              
              <div className="relative mb-3">
                <Input
                  placeholder="Buscar medicamento..."
                  value={searchMedicamento}
                  onChange={(e) => setSearchMedicamento(e.target.value)}
                />
                
                {searchMedicamento.length >= 2 && (
                  <Card className="absolute top-full left-0 right-0 mt-1 z-10 border-pink-200 shadow-lg">
                    <CardContent className="p-3">
                      {isSearching ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-pink-600" />
                          <span className="ml-2 text-sm text-gray-500">Buscando...</span>
                        </div>
                      ) : medicamentos.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Nenhum medicamento encontrado. 
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate(createPageUrl("MedicamentosDatabase"))}
                            className="px-1"
                          >
                            Cadastrar medicamentos
                          </Button>
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {medicamentos.map((med) => (
                            <button
                              key={med.id}
                              type="button"
                              onClick={() => {
                                addMedicamento(med);
                                setSearchMedicamento("");
                              }}
                              className="w-full text-left p-2 hover:bg-pink-50 rounded-lg transition-colors border border-gray-200"
                            >
                              <div className="flex items-start gap-2">
                                <Pill className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm text-gray-900">
                                      {med.nome}
                                    </p>
                                    {med.uso_frequente && (
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                    )}
                                  </div>
                                  {med.apresentacao && (
                                    <p className="text-xs text-gray-600">{med.apresentacao}</p>
                                  )}
                                  {med.posologia && (
                                    <p className="text-xs text-gray-700 mt-1">{med.posologia}</p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {selectedMedicamentos.length > 0 && (
                <div className="space-y-3 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">Medicamentos Adicionados ({selectedMedicamentos.length})</p>
                  {selectedMedicamentos.map((med) => (
                    <Card key={med.id} className="p-3 bg-white">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Input
                            value={med.nome}
                            onChange={(e) => updateMedicamento(med.id, 'nome', e.target.value)}
                            placeholder="Nome do medicamento"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMedicamento(med.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={med.posologia}
                          onChange={(e) => updateMedicamento(med.id, 'posologia', e.target.value)}
                          placeholder="Posologia (ex: 1 comprimido a cada 8 horas)"
                          rows={2}
                        />
                        <Select
                          value={med.via_administracao}
                          onValueChange={(value) => updateMedicamento(med.id, 'via_administracao', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Via de administração" />
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
                    </Card>
                  ))}
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Preview da Receita:</p>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">{generateReceitaText()}</pre>
                  </div>
                </div>
              )}
              
              <Textarea
                id="texto"
                value={formData.template_texto}
                onChange={(e) => setFormData({ ...formData, template_texto: e.target.value })}
                placeholder="Ou digite o texto livre da receita..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use os medicamentos acima OU digite texto livre. Ao salvar, medicamentos adicionados serão agrupados por via de administração.
              </p>
            </div>

            <div>
              <Label htmlFor="orientacoes">Orientações ao Paciente (opcional)</Label>
              <Textarea
                id="orientacoes"
                value={formData.orientacoes}
                onChange={(e) => setFormData({ ...formData, orientacoes: e.target.value })}
                placeholder="Orientações de uso, cuidados, etc."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="cabecalho">Cabeçalho (opcional)</Label>
              <Textarea
                id="cabecalho"
                value={formData.cabecalho}
                onChange={(e) => setFormData({ ...formData, cabecalho: e.target.value })}
                placeholder="Nome, endereço e contato do médico/clínica"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="rodape">Rodapé (opcional)</Label>
              <Textarea
                id="rodape"
                value={formData.rodape}
                onChange={(e) => setFormData({ ...formData, rodape: e.target.value })}
                placeholder="Assinatura, CRM, etc"
                rows={3}
              />
            </div>

            <div>
              <Label>Logo (3x3cm - opcional)</Label>
              <div className="flex gap-2 items-center mt-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                />
                {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
              {formData.logo_url && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <ImageIcon className="w-4 h-4" />
                  Logo carregado
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
              <Label htmlFor="default">Definir como modelo padrão</Label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              {editingTemplate ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o modelo "{deleteConfirm?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGuard>
  );
}