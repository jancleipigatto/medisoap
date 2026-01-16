import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: ""
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setIsLoading(true);
    const currentUser = await User.me();
    setUser(currentUser);
    setFormData({
      full_name: currentUser.full_name || "",
      email: currentUser.email || ""
    });
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await User.updateMe({
      full_name: formData.full_name
    });
    setIsSaving(false);
    alert("Dados atualizados com sucesso!");
    navigate(createPageUrl("Home"));
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-600 mt-1">Atualize suas informações pessoais</p>
          </div>
        </div>

        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Digite seu nome completo"
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2"><strong>Perfil:</strong> {user?.role === 'admin' ? 'Admin' : user?.profile_type || 'Standard'}</p>
              <p className="text-sm text-gray-600"><strong>Membro desde:</strong> {new Date(user?.created_date).toLocaleDateString('pt-BR')}</p>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}