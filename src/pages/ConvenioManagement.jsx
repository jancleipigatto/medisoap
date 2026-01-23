import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, Edit, Trash2, ArrowLeft, Loader2 } from "lucide-react";
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

export default function ConvenioManagement() {
  const navigate = useNavigate();
  const [convenios, setConvenios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConvenio, setEditingConvenio] = useState(null);
  const [deleteConvenio, setDeleteConvenio] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    nome_fantasia: "",
    cnpj: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    telefone: "",
    email: "",
    observacoes: ""
  });

  useEffect(() => {
    loadConvenios();
  }, []);

  const loadConvenios = async () => {
    const data = await base44.entities.Convenio.list("-created_date");
    setConvenios(data);
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData({
            ...formData,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            uf: data.uf
          });
        } else {
          alert('CEP não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleEdit = (convenio) => {
    setEditingConvenio(convenio);
    setFormData({
      nome: convenio.nome || "",
      nome_fantasia: convenio.nome_fantasia || "",
      cnpj: convenio.cnpj || "",
      cep: convenio.cep || "",
      logradouro: convenio.logradouro || "",
      numero: convenio.numero || "",
      complemento: convenio.complemento || "",
      bairro: convenio.bairro || "",
      cidade: convenio.cidade || "",
      uf: convenio.uf || "",
      telefone: convenio.telefone || "",
      email: convenio.email || "",
      observacoes: convenio.observacoes || ""
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingConvenio) {
      await base44.entities.Convenio.update(editingConvenio.id, formData);
    } else {
      await base44.entities.Convenio.create(formData);
    }
    
    handleCloseForm();
    loadConvenios();
  };

  const handleDelete = async () => {
    if (deleteConvenio) {
      await base44.entities.Convenio.delete(deleteConvenio.id);
      setDeleteConvenio(null);
      loadConvenios();
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingConvenio(null);
    setFormData({
      nome: "",
      nome_fantasia: "",
      cnpj: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
      telefone: "",
      email: "",
      observacoes: ""
    });
  };

  return (
    <PermissionGuard permission="can_create_anamnesis">
      <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
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
              <h1 className="text-3xl font-bold text-gray-900">Convênios</h1>
              <p className="text-gray-600 mt-1">Gerencie os convênios cadastrados</p>
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <Button
              onClick={() => { setShowForm(true); setEditingConvenio(null); }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Convênio
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {convenios.map((convenio) => (
              <Card key={convenio.id} className="shadow-md border-none hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{convenio.nome}</CardTitle>
                      {convenio.nome_fantasia && (
                        <p className="text-sm text-gray-500 mt-1 truncate">{convenio.nome_fantasia}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(convenio)}
                        className="flex-shrink-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConvenio(convenio)}
                        className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  {convenio.cnpj && <p><strong>CNPJ:</strong> {convenio.cnpj}</p>}
                  {convenio.telefone && <p><strong>Telefone:</strong> {convenio.telefone}</p>}
                  {convenio.email && <p className="truncate"><strong>E-mail:</strong> {convenio.email}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {convenios.length === 0 && (
            <Card className="shadow-md border-none">
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum convênio cadastrado</h3>
                <p className="text-gray-500 mb-6">Comece adicionando seu primeiro convênio</p>
                <Button
                  onClick={() => { setShowForm(true); setEditingConvenio(null); }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Convênio
                </Button>
              </CardContent>
            </Card>
          )}

          <Dialog open={showForm} onOpenChange={handleCloseForm}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingConvenio ? "Editar Convênio" : "Novo Convênio"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                  <Input
                    id="nome_fantasia"
                    value={formData.nome_fantasia}
                    onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        maxLength={8}
                        value={formData.cep}
                        onChange={(e) => setFormData({...formData, cep: e.target.value})}
                        onBlur={handleCepBlur}
                        placeholder="00000000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Digite o CEP para preencher automaticamente</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="logradouro">Logradouro</Label>
                        <Input
                          id="logradouro"
                          value={formData.logradouro}
                          onChange={(e) => setFormData({...formData, logradouro: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="numero">Número</Label>
                        <Input
                          id="numero"
                          value={formData.numero}
                          onChange={(e) => setFormData({...formData, numero: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input
                          id="complemento"
                          value={formData.complemento}
                          onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bairro">Bairro</Label>
                        <Input
                          id="bairro"
                          value={formData.bairro}
                          onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input
                          id="cidade"
                          value={formData.cidade}
                          onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="uf">UF</Label>
                        <Input
                          id="uf"
                          maxLength={2}
                          value={formData.uf}
                          onChange={(e) => setFormData({...formData, uf: e.target.value.toUpperCase()})}
                          placeholder="SP"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Contato</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    {editingConvenio ? "Atualizar" : "Salvar"} Convênio
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deleteConvenio} onOpenChange={() => setDeleteConvenio(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o convênio "{deleteConvenio?.nome}"? Esta ação não pode ser desfeita.
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