import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Stethoscope, Loader2, CheckCircle2 } from "lucide-react";

export default function CompletarPerfil() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    organizacao: "",
    telefone: "",
    tem_whatsapp: false,
    endereco_rua: "",
    endereco_numero: "",
    endereco_complemento: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_estado: "",
    endereco_cep: "",
    termos_aceitos: false
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Se o perfil já está completo, redireciona para home
      if (currentUser.perfil_completo) {
        navigate(createPageUrl("Home"));
        return;
      }
      
      // Preenche com dados existentes, se houver
      setFormData({
        organizacao: currentUser.organizacao || "",
        telefone: currentUser.telefone || "",
        tem_whatsapp: currentUser.tem_whatsapp || false,
        endereco_rua: currentUser.endereco_rua || "",
        endereco_numero: currentUser.endereco_numero || "",
        endereco_complemento: currentUser.endereco_complemento || "",
        endereco_bairro: currentUser.endereco_bairro || "",
        endereco_cidade: currentUser.endereco_cidade || "",
        endereco_estado: currentUser.endereco_estado || "",
        endereco_cep: currentUser.endereco_cep || "",
        termos_aceitos: false
      });
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
    setIsLoading(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.termos_aceitos) {
      alert("Você precisa aceitar os termos de uso para continuar");
      return;
    }

    setIsSaving(true);
    
    try {
      await base44.auth.updateMe({
        ...formData,
        perfil_completo: true,
        data_aceite_termos: new Date().toISOString()
      });
      
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao salvar perfil. Tente novamente.");
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete seu Perfil
          </h1>
          <p className="text-gray-600">
            Olá, <span className="font-semibold">{user?.full_name}</span>! Vamos completar suas informações
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Profissionais */}
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Informações Profissionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="organizacao">Organização/Clínica</Label>
                <Input
                  id="organizacao"
                  value={formData.organizacao}
                  onChange={(e) => handleChange("organizacao", e.target.value)}
                  placeholder="Nome da clínica ou organização"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whatsapp"
                  checked={formData.tem_whatsapp}
                  onCheckedChange={(checked) => handleChange("tem_whatsapp", checked)}
                />
                <Label htmlFor="whatsapp" className="cursor-pointer">
                  Este número possui WhatsApp
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.endereco_cep}
                    onChange={(e) => handleChange("endereco_cep", e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="rua">Rua/Avenida</Label>
                  <Input
                    id="rua"
                    value={formData.endereco_rua}
                    onChange={(e) => handleChange("endereco_rua", e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>
                
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.endereco_numero}
                    onChange={(e) => handleChange("endereco_numero", e.target.value)}
                    placeholder="123"
                  />
                </div>
                
                <div>
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.endereco_complemento}
                    onChange={(e) => handleChange("endereco_complemento", e.target.value)}
                    placeholder="Apto, sala, etc"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.endereco_bairro}
                    onChange={(e) => handleChange("endereco_bairro", e.target.value)}
                    placeholder="Nome do bairro"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.endereco_cidade}
                    onChange={(e) => handleChange("endereco_cidade", e.target.value)}
                    placeholder="Nome da cidade"
                  />
                </div>
                
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.endereco_estado}
                    onChange={(e) => handleChange("endereco_estado", e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Termos de Uso */}
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Termos de Uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Ao utilizar o MediSOAP, você concorda em:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Utilizar o sistema de forma responsável e ética</li>
                    <li>Proteger a confidencialidade dos dados dos pacientes</li>
                    <li>Seguir as normas e regulamentações médicas vigentes</li>
                    <li>Manter suas credenciais de acesso seguras</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="termos"
                  checked={formData.termos_aceitos}
                  onCheckedChange={(checked) => handleChange("termos_aceitos", checked)}
                  className="mt-1"
                />
                <Label htmlFor="termos" className="cursor-pointer">
                  Li e aceito os termos de uso do aplicativo MediSOAP *
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSaving || !formData.termos_aceitos}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Completar Perfil
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}