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
import { ArrowLeft, Plus, Trash2, Edit, Pill, Loader2, Image as ImageIcon, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import PermissionGuard from "../components/PermissionGuard";

export default function ReceitaTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    template_texto: "",
    cabecalho: "",
    rodape: "",
    logo_url: "",
    is_default: false
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await ReceitaTemplate.list("-created_date");
    setTemplates(data);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData(template);
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
    if (!formData.nome || !formData.template_texto) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    if (formData.is_default) {
      const currentDefault = templates.find(t => t.is_default && t.id !== editingTemplate?.id);
      if (currentDefault) {
        await ReceitaTemplate.update(currentDefault.id, { is_default: false });
      }
    }

    if (editingTemplate) {
      await ReceitaTemplate.update(editingTemplate.id, formData);
    } else {
      await ReceitaTemplate.create(formData);
    }

    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      nome: "",
      template_texto: "",
      cabecalho: "",
      rodape: "",
      logo_url: "",
      is_default: false
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
    setFormData({
      nome: "",
      template_texto: "",
      cabecalho: "",
      rodape: "",
      logo_url: "",
      is_default: false
    });
  };

  return (
    <PermissionGuard permission="can_access_templates">
      <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Home"))}
              className="shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Pill className="w-8 h-8" />
                Modelos de Receita
              </h1>
              <p className="text-gray-600 mt-1">Gerencie seus modelos de receita médica</p>
            </div>
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
              <Label htmlFor="texto">Texto da Receita *</Label>
              <Textarea
                id="texto"
                value={formData.template_texto}
                onChange={(e) => setFormData({ ...formData, template_texto: e.target.value })}
                placeholder="Digite o texto modelo da receita..."
                className="min-h-[200px]"
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