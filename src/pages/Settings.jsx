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
    endereco_consultorio: "",
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
        endereco_consultorio: user.app_settings.endereco_consultorio || "",
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
              <div>
                <Label htmlFor="endereco">Endereço do Consultório</Label>
                <Input
                  id="endereco"
                  placeholder="Rua, número, bairro, cidade - Estado"
                  value={settings.endereco_consultorio}
                  onChange={(e) => setSettings({ ...settings, endereco_consultorio: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este endereço será usado nos rodapés dos documentos médicos
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