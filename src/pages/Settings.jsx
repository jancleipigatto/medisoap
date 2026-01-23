import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Save, Upload, Loader2, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PermissionGuard from "../components/PermissionGuard";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    timezone: "America/Sao_Paulo",
    logo_padrao_url: "",
    assinatura_plano: "Gratuito"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const timezones = [
    { value: "America/Sao_Paulo", label: "Brasília (UTC-3)" },
    { value: "America/Noronha", label: "Fernando de Noronha (UTC-2)" },
    { value: "America/Manaus", label: "Manaus (UTC-4)" },
    { value: "America/Rio_Branco", label: "Acre (UTC-5)" },
    { value: "America/New_York", label: "Nova York (UTC-5)" },
    { value: "America/Chicago", label: "Chicago (UTC-6)" },
    { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)" },
    { value: "Europe/London", label: "Londres (UTC+0)" },
    { value: "Europe/Paris", label: "Paris (UTC+1)" },
    { value: "Asia/Tokyo", label: "Tóquio (UTC+9)" },
    { value: "Australia/Sydney", label: "Sydney (UTC+10)" }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const user = await User.me();
    
    // Carregar configurações do usuário
    if (user.app_settings) {
      setSettings({
        cep: user.app_settings.cep || "",
        logradouro: user.app_settings.logradouro || "",
        numero: user.app_settings.numero || "",
        complemento: user.app_settings.complemento || "",
        bairro: user.app_settings.bairro || "",
        cidade: user.app_settings.cidade || "",
        uf: user.app_settings.uf || "",
        timezone: user.app_settings.timezone || "America/Sao_Paulo",
        logo_padrao_url: user.app_settings.logo_padrao_url || "",
        assinatura_plano: user.app_settings.assinatura_plano || "Gratuito"
      });
    }
    
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    await base44.auth.updateMe({
      app_settings: settings
    });
    
    setIsSaving(false);
    alert("Configurações salvas com sucesso!");
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    const result = await base44.integrations.Core.UploadFile({ file });
    setSettings({ ...settings, logo_padrao_url: result.file_url });
    
    setIsUploading(false);
  };

  const handleCepBlur = async () => {
    const cep = settings.cep.replace(/\D/g, ''); // Remove caracteres não numéricos

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          // Preenche os campos automaticamente
          setSettings({
            ...settings,
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
        alert('Erro ao buscar CEP. Tente novamente.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-6" />
          <Card className="shadow-lg border-none">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="can_create_anamnesis">
      <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <SettingsIcon className="w-8 h-8 text-blue-600" />
                Configurações
              </h1>
              <p className="text-gray-600 mt-1">Configure as preferências do sistema</p>
            </div>
          </div>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Endereço do Consultório</h3>
                
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    maxLength={8}
                    placeholder="00000000"
                    value={settings.cep}
                    onChange={(e) => setSettings({ ...settings, cep: e.target.value })}
                    onBlur={handleCepBlur}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="rua">Logradouro</Label>
                  <Input
                    id="rua"
                    placeholder="Rua, Avenida, etc"
                    value={settings.logradouro}
                    onChange={(e) => setSettings({ ...settings, logradouro: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      placeholder="123"
                      value={settings.numero}
                      onChange={(e) => setSettings({ ...settings, numero: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      placeholder="Apto 10, Sala 5, etc"
                      value={settings.complemento}
                      onChange={(e) => setSettings({ ...settings, complemento: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    placeholder="Nome do bairro"
                    value={settings.bairro}
                    onChange={(e) => setSettings({ ...settings, bairro: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      placeholder="Nome da cidade"
                      value={settings.cidade}
                      onChange={(e) => setSettings({ ...settings, cidade: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="uf">UF</Label>
                    <Input
                      id="uf"
                      maxLength={2}
                      placeholder="SP"
                      value={settings.uf}
                      onChange={(e) => setSettings({ ...settings, uf: e.target.value.toUpperCase() })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Digite o CEP e os campos serão preenchidos automaticamente
                </p>
              </div>

              <div>
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                >
                  <SelectTrigger id="timezone" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Define o fuso horário para data e hora dos atendimentos
                </p>
              </div>

              <div>
                <Label htmlFor="logo">Logotipo Padrão</Label>
                <div className="mt-2 flex items-center gap-4">
                  {settings.logo_padrao_url && (
                    <img
                      src={settings.logo_padrao_url}
                      alt="Logo"
                      className="w-24 h-24 object-contain border rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload').click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload de Logotipo
                        </>
                      )}
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recomendado: 3cm x 3cm (aproximadamente 300x300 pixels)
                </p>
              </div>

              <div>
                <Label htmlFor="assinatura">Tipo de Assinatura</Label>
                <Input
                  id="assinatura"
                  value={settings.assinatura_plano}
                  disabled
                  className="mt-2 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Plano atual do sistema
                </p>
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
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}