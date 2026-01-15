import React, { useState, useEffect } from "react";
import { AtestadoTemplate } from "@/entities/AtestadoTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ClipboardList, Edit, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PermissionGuard from "../components/PermissionGuard";
import { UploadFile } from "@/integrations/Core"; // Added UploadFile import

export default function AtestadoTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTemplate, setDeleteTemplate] = useState(null);
  const [isUploading, setIsUploading] = useState(false); // Added isUploading state
  const [formData, setFormData] = useState({
    nome: "",
    template_texto: "",
    cabecalho: "", // Added cabecalho
    rodape: "", // Added rodape
    logo_url: "", // Added logo_url
    is_default: false
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await AtestadoTemplate.list("-created_date");
    setTemplates(data);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      nome: template.nome || "",
      template_texto: template.template_texto || "",
      cabecalho: template.cabecalho || "", // Populating cabecalho
      rodape: template.rodape || "", // Populating rodape
      logo_url: template.logo_url || "", // Populating logo_url
      is_default: template.is_default || false
    });
    setShowForm(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await UploadFile({ file });
      setFormData({...formData, logo_url: result.file_url});
    } catch (error) {
      console.error("Error uploading logo:", error);
      // Optionally show an error message to the user
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.is_default) {
      const allTemplates = await AtestadoTemplate.list();
      for (const t of allTemplates) {
        if (t.is_default && t.id !== editingTemplate?.id) {
          await AtestadoTemplate.update(t.id, { is_default: false });
        }
      }
    }
    
    if (editingTemplate) {
      await AtestadoTemplate.update(editingTemplate.id, formData);
    } else {
      await AtestadoTemplate.create(formData);
    }
    
    setFormData({ nome: "", template_texto: "", cabecalho: "", rodape: "", logo_url: "", is_default: false }); // Resetting new fields
    setEditingTemplate(null);
    setShowForm(false);
    loadTemplates();
  };

  const handleDelete = async () => {
    if (deleteTemplate) {
      await AtestadoTemplate.delete(deleteTemplate.id);
      setDeleteTemplate(null);
      loadTemplates();
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({ nome: "", template_texto: "", cabecalho: "", rodape: "", logo_url: "", is_default: false }); // Resetting new fields
  };

  return (
    <PermissionGuard permission="can_access_templates">
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Modelos de Atestado</h1>
              <p className="text-gray-600 mt-1">Crie modelos reutilizáveis de atestados médicos</p>
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Modelo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="shadow-md border-none hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg truncate">{template.nome}</CardTitle>
                        {template.is_default && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Padrão</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                        className="flex-shrink-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTemplate(template)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap font-mono">
                      {template.template_texto}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {templates.length === 0 && (
            <Card className="shadow-md border-none">
              <CardContent className="p-12 text-center">
                <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum modelo cadastrado</h3>
                <p className="text-gray-500 mb-6">Crie modelos para agilizar seus atestados</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Primeiro Modelo
                </Button>
              </CardContent>
            </Card>
          )}

          <Dialog open={showForm} onOpenChange={handleCloseForm}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"> {/* Changed max-w-2xl to max-w-3xl */}
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Editar Modelo" : "Novo Modelo"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Modelo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Ex: Atestado 3 dias, Atestado repouso"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <Label htmlFor="is_default" className="font-normal cursor-pointer">
                    Definir como modelo padrão
                  </Label>
                </div>

                <div>
                  <Label htmlFor="logo">Logotipo (idealmente 3x3cm)</Label>
                  <div className="flex items-center gap-4">
                    {formData.logo_url && (
                      <img 
                        src={formData.logo_url} 
                        alt="Logo" 
                        className="w-24 h-24 object-contain border rounded p-1 bg-white"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploading}
                        className="file:text-blue-600 file:hover:text-blue-700 file:cursor-pointer"
                      />
                      {isUploading && <p className="text-sm text-gray-500 mt-1">Enviando imagem...</p>}
                      {formData.logo_url && !isUploading && (
                        <p className="text-sm text-gray-500 mt-1">
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, logo_url: ""})}
                            className="text-red-500 hover:text-red-700 underline"
                          >
                            Remover logo
                          </button>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cabecalho">Cabeçalho</Label>
                  <Textarea
                    id="cabecalho"
                    value={formData.cabecalho}
                    onChange={(e) => setFormData({...formData, cabecalho: e.target.value})}
                    placeholder="Ex: Nome do médico, especialidade, CRM, endereço, telefone..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="template_texto">Texto do Modelo *</Label>
                  <Textarea
                    id="template_texto"
                    value={formData.template_texto}
                    onChange={(e) => setFormData({...formData, template_texto: e.target.value})}
                    placeholder="Digite o texto do atestado..."
                    className="min-h-[200px] font-mono text-sm" // Adjusted min-h
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="rodape">Rodapé</Label>
                  <Textarea
                    id="rodape"
                    value={formData.rodape}
                    onChange={(e) => setFormData({...formData, rodape: e.target.value})}
                    placeholder="Ex: Assinatura, carimbo, informações adicionais..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    {editingTemplate ? "Atualizar" : "Salvar"} Modelo
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o modelo "{deleteTemplate?.nome}"? Esta ação não pode ser desfeita.
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
        </div>
      </div>
    </PermissionGuard>
  );
}