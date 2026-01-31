import React, { useState, useEffect } from "react";
import { ProfileTemplate } from "@/entities/ProfileTemplate";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, Edit, Trash2, Users, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function ProfileManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [deleteProfile, setDeleteProfile] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    can_access_templates: false,
    can_access_patients: false,
    can_create_anamnesis: false,
    can_view_all_anamnesis: false,
    can_access_reception: false,
    can_perform_triage: false,
    can_manage_schedule: false,
    roles: [],
    is_default: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const me = await User.me();
    setCurrentUser(me);
    
    if (!me.is_master) {
      setIsLoading(false);
      return;
    }
    
    const allProfiles = await ProfileTemplate.list("-created_date");
    const allUsers = await User.list();
    
    setProfiles(allProfiles);
    setUsers(allUsers);
    setIsLoading(false);
  };

  const getUserCountForProfile = (profile) => {
    return users.filter(u => u.profile_template_id === profile.id).length;
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      nome: profile.nome || "",
      descricao: profile.descricao || "",
      can_access_templates: profile.can_access_templates || false,
      can_access_patients: profile.can_access_patients || false,
      can_create_anamnesis: profile.can_create_anamnesis || false,
      can_view_all_anamnesis: profile.can_view_all_anamnesis || false,
      can_access_reception: profile.can_access_reception || false,
      can_perform_triage: profile.can_perform_triage || false,
      can_manage_schedule: profile.can_manage_schedule || false,
      roles: profile.roles || [],
      is_default: profile.is_default || false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Se marcando como padrão, desmarcar outros
    if (formData.is_default) {
      const allProfiles = await ProfileTemplate.list();
      for (const p of allProfiles) {
        if (p.is_default && p.id !== editingProfile?.id) {
          await ProfileTemplate.update(p.id, { is_default: false });
        }
      }
    }
    
    if (editingProfile) {
      await ProfileTemplate.update(editingProfile.id, formData);
    } else {
      await ProfileTemplate.create(formData);
    }
    
    setFormData({
      nome: "",
      descricao: "",
      can_access_templates: false,
      can_access_patients: false,
      can_create_anamnesis: false,
      can_view_all_anamnesis: false,
      can_access_reception: false,
      can_perform_triage: false,
      can_manage_schedule: false,
      roles: [],
      is_default: false
    });
    setEditingProfile(null);
    setShowForm(false);
    loadData();
  };

  const handleDelete = async () => {
    if (deleteProfile) {
      await ProfileTemplate.delete(deleteProfile.id);
      setDeleteProfile(null);
      loadData();
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProfile(null);
    setFormData({
      nome: "",
      descricao: "",
      can_access_templates: false,
      can_access_patients: false,
      can_create_anamnesis: false,
      can_view_all_anamnesis: false,
      can_access_reception: false,
      can_perform_triage: false,
      can_manage_schedule: false,
      roles: [],
      is_default: false
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!currentUser?.is_master) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Acesso Restrito
              </h3>
              <p className="text-gray-600">
                Apenas o administrador master pode gerenciar perfis.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Perfis</h1>
              <p className="text-gray-600 mt-1">Configure perfis de acesso reutilizáveis para novos usuários</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Perfil
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => {
            const userCount = getUserCountForProfile(profile);
            return (
              <Card key={profile.id} className="shadow-md border-none hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg truncate">{profile.nome}</CardTitle>
                        {profile.is_default && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Padrão</Badge>
                        )}
                      </div>
                      {profile.descricao && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {profile.descricao}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(profile)}
                        className="flex-shrink-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteProfile(profile)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-700">
                      {userCount} {userCount === 1 ? 'usuário' : 'usuários'}
                    </span>
                  </div>
                  
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600 mb-2">Funcionalidades:</p>
                    {profile.can_manage_schedule && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Gerenciar Agendas</span>
                      </div>
                    )}
                    {profile.can_create_anamnesis && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Criar Anamneses</span>
                      </div>
                    )}
                    {profile.can_access_patients && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Acessar Pacientes</span>
                      </div>
                    )}
                    {profile.can_access_templates && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Acessar Modelos</span>
                      </div>
                    )}
                    {profile.can_view_all_anamnesis && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Ver Todas Anamneses</span>
                      </div>
                    )}
                    {profile.can_access_reception && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Acessar Recepção</span>
                      </div>
                    )}
                    {profile.can_perform_triage && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Realizar Triagem</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {profiles.length === 0 && (
          <Card className="shadow-md border-none">
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum perfil cadastrado</h3>
              <p className="text-gray-500 mb-6">Crie perfis para facilitar a configuração de novos usuários</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Perfil
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={showForm} onOpenChange={handleCloseForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProfile ? "Editar Perfil" : "Novo Perfil"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Perfil *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Médico Clínico, Secretária, Especialista"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Breve descrição do perfil e suas responsabilidades"
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-4">Áreas de Atuação (Simplificado)</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {['agendamento', 'recepcao', 'triagem', 'consulta'].map(role => {
                     const isChecked = formData.roles?.includes(role);
                     const labels = {
                       agendamento: "Agendamento",
                       recepcao: "Recepção",
                       triagem: "Triagem",
                       consulta: "Consulta (Médico)"
                     };
                     
                     const handleRoleChange = (checked) => {
                       let newRoles = checked 
                         ? [...(formData.roles || []), role]
                         : (formData.roles || []).filter(r => r !== role);
                       
                       // Auto-set permissions based on roles
                       const newPermissions = { ...formData, roles: newRoles };
                       
                       if (checked) {
                         if (role === 'agendamento') newPermissions.can_manage_schedule = true;
                         if (role === 'recepcao') {
                           newPermissions.can_access_reception = true;
                           newPermissions.can_access_patients = true;
                         }
                         if (role === 'triagem') {
                           newPermissions.can_perform_triage = true;
                           newPermissions.can_access_patients = true;
                         }
                         if (role === 'consulta') {
                           newPermissions.can_create_anamnesis = true;
                           newPermissions.can_access_patients = true;
                           newPermissions.can_access_templates = true;
                         }
                       }
                       // Note: we don't auto-uncheck permissions because they might be needed by other roles
                       
                       setFormData(newPermissions);
                     };

                     return (
                        <div key={role} className="flex items-center space-x-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                          <Switch
                            id={`role-${role}`}
                            checked={isChecked}
                            onCheckedChange={handleRoleChange}
                          />
                          <Label htmlFor={`role-${role}`} className="font-medium cursor-pointer">
                            {labels[role]}
                          </Label>
                        </div>
                     );
                  })}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-4">Funcionalidades do Perfil</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="manage_schedule" className="font-medium">Gerenciar Agendas</Label>
                      <p className="text-sm text-gray-500">Ver e gerenciar agendas de todos os profissionais</p>
                    </div>
                    <Switch
                      id="manage_schedule"
                      checked={formData.can_manage_schedule}
                      onCheckedChange={(checked) => setFormData({...formData, can_manage_schedule: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="anamnesis" className="font-medium">Criar Anamneses</Label>
                      <p className="text-sm text-gray-500">Permite criar e visualizar suas próprias anamneses</p>
                    </div>
                    <Switch
                      id="anamnesis"
                      checked={formData.can_create_anamnesis}
                      onCheckedChange={(checked) => setFormData({...formData, can_create_anamnesis: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="patients" className="font-medium">Acessar Pacientes</Label>
                      <p className="text-sm text-gray-500">Visualizar e gerenciar cadastro de pacientes</p>
                    </div>
                    <Switch
                      id="patients"
                      checked={formData.can_access_patients}
                      onCheckedChange={(checked) => setFormData({...formData, can_access_patients: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="templates" className="font-medium">Acessar Modelos</Label>
                      <p className="text-sm text-gray-500">Visualizar e gerenciar modelos de documentos</p>
                    </div>
                    <Switch
                      id="templates"
                      checked={formData.can_access_templates}
                      onCheckedChange={(checked) => setFormData({...formData, can_access_templates: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="viewall" className="font-medium">Ver Todas as Anamneses</Label>
                      <p className="text-sm text-gray-500">Visualizar anamneses de todos os usuários</p>
                    </div>
                    <Switch
                      id="viewall"
                      checked={formData.can_view_all_anamnesis}
                      onCheckedChange={(checked) => setFormData({...formData, can_view_all_anamnesis: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="reception" className="font-medium">Acessar Recepção</Label>
                      <p className="text-sm text-gray-500">Realizar recepção de pacientes</p>
                    </div>
                    <Switch
                      id="reception"
                      checked={formData.can_access_reception}
                      onCheckedChange={(checked) => setFormData({...formData, can_access_reception: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="triage" className="font-medium">Realizar Triagem</Label>
                      <p className="text-sm text-gray-500">Realizar triagem de pacientes</p>
                    </div>
                    <Switch
                      id="triage"
                      checked={formData.can_perform_triage}
                      onCheckedChange={(checked) => setFormData({...formData, can_perform_triage: checked})}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
                  />
                  <div>
                    <Label htmlFor="is_default" className="font-medium cursor-pointer">
                      Tornar este perfil o padrão para novos usuários
                    </Label>
                    <p className="text-sm text-gray-600">
                      Novos usuários receberão automaticamente as permissões deste perfil
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  {editingProfile ? "Atualizar" : "Criar"} Perfil
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteProfile} onOpenChange={() => setDeleteProfile(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o perfil "{deleteProfile?.nome}"? 
                Os usuários que usam este perfil não serão afetados, mas você não poderá aplicá-lo a novos usuários.
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