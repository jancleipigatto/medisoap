import React, { useState, useEffect } from "react";
import { AnamnesisTemplate } from "@/entities/AnamnesisTemplate";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { Plus, LayoutTemplate, Edit, Trash2, ArrowLeft } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { User } from "@/entities/User";

export default function TemplatesContent() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTemplate, setDeleteTemplate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    template_texto: "",
    is_default: false,
    is_public_org: false
  });

  useEffect(() => {
    loadUser();
    loadTemplates();
  }, []);

  const loadUser = async () => {
    const user = await User.me();
    setCurrentUser(user);
  };

  const loadTemplates = async () => {
    const allData = await AnamnesisTemplate.list("-created_date");
    const user = await User.me();
    
    // Filtrar templates: MediSOAP públicos + organização públicos + próprios
    const filtered = allData.filter(t => 
      t.is_medisoap_public || 
      t.is_public_org || 
      t.created_by === user.email
    );
    
    setTemplates(filtered);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      nome: template.nome || "",
      descricao: template.descricao || "",
      template_texto: template.template_texto || "",
      is_default: template.is_default || false,
      is_public_org: template.is_public_org || false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If the current template is being marked as default, unmark any other default templates
    if (formData.is_default) {
      const allTemplates = await AnamnesisTemplate.list();
      for (const t of allTemplates) {
        // Only unmark if it's a different template and it's currently marked as default
        if (t.is_default && t.id !== editingTemplate?.id) {
          await AnamnesisTemplate.update(t.id, { is_default: false });
        }
      }
    }
    
    if (editingTemplate) {
      await AnamnesisTemplate.update(editingTemplate.id, formData);
    } else {
      await AnamnesisTemplate.create(formData);
    }
    
    setFormData({
      nome: "",
      descricao: "",
      template_texto: "",
      is_default: false,
      is_public_org: false
    });
    setEditingTemplate(null);
    setShowForm(false);
    loadTemplates();
  };

  const handleDelete = async () => {
    if (deleteTemplate) {
      await AnamnesisTemplate.delete(deleteTemplate.id);
      setDeleteTemplate(null);
      loadTemplates();
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      nome: "",
      descricao: "",
      template_texto: "",
      is_default: false,
      is_public_org: false
    });
  };

  return (
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
            <h1 className="text-3xl font-bold text-gray-900">Modelos de Prontuários</h1>
            <p className="text-gray-600 mt-1">Crie modelos reutilizáveis para diferentes situações</p>
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
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <LayoutTemplate className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg truncate">{template.nome}</CardTitle>
                      {template.is_default && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Padrão</Badge>
                      )}
                      {template.is_medisoap_public && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">MediSOAP</Badge>
                      )}
                      {template.is_public_org && !template.is_medisoap_public && (
                        <Badge className="bg-purple-100 text-purple-700 text-xs">Organização</Badge>
                      )}
                      {!template.is_public_org && !template.is_medisoap_public && (
                        <Badge className="bg-gray-100 text-gray-700 text-xs">Privado</Badge>
                      )}
                    </div>
                    {template.descricao && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {template.descricao}
                      </p>
                    )}
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
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">
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
              <LayoutTemplate className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum modelo cadastrado</h3>
              <p className="text-gray-500 mb-6">Crie modelos para agilizar suas anamneses</p>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  placeholder="Ex: PS, PA, Unimed, UBS"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Breve descrição do modelo"
                />
              </div>

              <div className="space-y-3">
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

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="is_public_org" className="font-semibold cursor-pointer">
                      Compartilhar com a organização
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Quando ativado, todos os usuários da organização poderão usar este modelo
                    </p>
                  </div>
                  <Switch
                    id="is_public_org"
                    checked={formData.is_public_org}
                    onCheckedChange={(checked) => setFormData({...formData, is_public_org: checked})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="template_texto">Texto do Modelo *</Label>
                <RichTextEditor
                  value={formData.template_texto}
                  onChange={(value) => setFormData({...formData, template_texto: value})}
                  placeholder="Digite a estrutura do modelo de anamnese..."
                  minHeight="300px"
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
  );
}