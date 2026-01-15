import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [permissions, setPermissions] = useState({
    profile_type: "standard",
    can_access_templates: false,
    can_access_patients: false,
    can_create_anamnesis: false,
    can_view_all_anamnesis: false
  });

  const profilePresets = {
    standard: {
      can_access_templates: false,
      can_access_patients: true,
      can_create_anamnesis: true,
      can_view_all_anamnesis: false
    },
    expert: {
      can_access_templates: true,
      can_access_patients: true,
      can_create_anamnesis: true,
      can_view_all_anamnesis: true
    }
  };

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
    
    const allUsers = await User.list("-created_date");
    setUsers(allUsers);
    setIsLoading(false);
  };

  const handleEditPermissions = (user) => {
    setEditingUser(user);
    setPermissions({
      profile_type: user.profile_type || "standard",
      can_access_templates: user.can_access_templates || false,
      can_access_patients: user.can_access_patients || false,
      can_create_anamnesis: user.can_create_anamnesis || false,
      can_view_all_anamnesis: user.can_view_all_anamnesis || false
    });
  };

  const handleProfileChange = (profileType) => {
    const preset = profilePresets[profileType];
    if (preset) {
      setPermissions({
        profile_type: profileType,
        ...preset
      });
    } else {
      setPermissions({
        ...permissions,
        profile_type: profileType
      });
    }
  };

  const savePermissions = async () => {
    await User.update(editingUser.id, permissions);
    setEditingUser(null);
    loadData();
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
                Apenas o administrador master pode gerenciar usuários e permissões.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getProfileBadge = (user) => {
    if (user.is_master) {
      return { label: "Master Admin", color: "bg-red-100 text-red-700" };
    }
    const profiles = {
      admin: { label: "Administrador", color: "bg-purple-100 text-purple-700" },
      standard: { label: "Standard", color: "bg-blue-100 text-blue-700" },
      expert: { label: "Expert", color: "bg-green-100 text-green-700" }
    };
    return profiles[user.profile_type] || profiles.standard;
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
            <p className="text-gray-600 mt-1">Configure perfis e permissões de acesso para cada usuário</p>
          </div>
        </div>

        <div className="grid gap-4">
          {users.map((user) => {
            const profileBadge = getProfileBadge(user);
            return (
              <Card key={user.id} className="shadow-md border-none hover:shadow-xl transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.full_name}</CardTitle>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={profileBadge.color}>
                        {profileBadge.label}
                      </Badge>
                      {!user.is_master && (
                        <Button
                          onClick={() => handleEditPermissions(user)}
                          variant="outline"
                          size="sm"
                        >
                          Configurar Permissões
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {!user.is_master && (
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-3 rounded-lg ${user.can_access_templates ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-xs text-gray-600">Modelos</p>
                        <p className={`text-sm font-medium ${user.can_access_templates ? 'text-green-700' : 'text-gray-400'}`}>
                          {user.can_access_templates ? 'Permitido' : 'Bloqueado'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${user.can_access_patients ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-xs text-gray-600">Pacientes</p>
                        <p className={`text-sm font-medium ${user.can_access_patients ? 'text-green-700' : 'text-gray-400'}`}>
                          {user.can_access_patients ? 'Permitido' : 'Bloqueado'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${user.can_create_anamnesis ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-xs text-gray-600">Anamneses</p>
                        <p className={`text-sm font-medium ${user.can_create_anamnesis ? 'text-green-700' : 'text-gray-400'}`}>
                          {user.can_create_anamnesis ? 'Permitido' : 'Bloqueado'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${user.can_view_all_anamnesis ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-xs text-gray-600">Ver Todas</p>
                        <p className={`text-sm font-medium ${user.can_view_all_anamnesis ? 'text-green-700' : 'text-gray-400'}`}>
                          {user.can_view_all_anamnesis ? 'Permitido' : 'Bloqueado'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar Permissões</DialogTitle>
              <p className="text-sm text-gray-500">{editingUser?.full_name}</p>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <Label htmlFor="profile">Perfil do Usuário</Label>
                <Select
                  value={permissions.profile_type}
                  onValueChange={handleProfileChange}
                >
                  <SelectTrigger id="profile" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard - Acesso básico</SelectItem>
                    <SelectItem value="expert">Expert - Acesso avançado</SelectItem>
                    <SelectItem value="admin">Admin - Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2">
                  {permissions.profile_type === 'standard' && 'Pode criar anamneses e gerenciar seus pacientes'}
                  {permissions.profile_type === 'expert' && 'Acesso total: modelos, todos os pacientes e todas as anamneses'}
                  {permissions.profile_type === 'admin' && 'Todas as funcionalidades, mas só vê seus próprios dados'}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-4">Permissões Personalizadas</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="templates">Acessar Modelos</Label>
                    <p className="text-sm text-gray-500">Visualizar e gerenciar modelos de anamnese</p>
                  </div>
                  <Switch
                    id="templates"
                    checked={permissions.can_access_templates}
                    onCheckedChange={(checked) => setPermissions({...permissions, can_access_templates: checked})}
                  />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="patients">Acessar Pacientes</Label>
                    <p className="text-sm text-gray-500">Visualizar e gerenciar cadastro de pacientes</p>
                  </div>
                  <Switch
                    id="patients"
                    checked={permissions.can_access_patients}
                    onCheckedChange={(checked) => setPermissions({...permissions, can_access_patients: checked})}
                  />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="anamnesis">Criar Anamneses</Label>
                    <p className="text-sm text-gray-500">Criar e visualizar suas próprias anamneses</p>
                  </div>
                  <Switch
                    id="anamnesis"
                    checked={permissions.can_create_anamnesis}
                    onCheckedChange={(checked) => setPermissions({...permissions, can_create_anamnesis: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="viewall">Ver Todas as Anamneses</Label>
                    <p className="text-sm text-gray-500">Visualizar anamneses de todos os usuários</p>
                  </div>
                  <Switch
                    id="viewall"
                    checked={permissions.can_view_all_anamnesis}
                    onCheckedChange={(checked) => setPermissions({...permissions, can_view_all_anamnesis: checked})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button onClick={savePermissions} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Salvar Permissões
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}