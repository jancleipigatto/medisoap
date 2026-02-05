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
import { Stethoscope, Loader2, CheckCircle2, User, Camera, Upload, X, ShieldCheck } from "lucide-react";
import WebcamCapture from "@/components/common/WebcamCapture";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function CompletarPerfil() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({
    organizacao: "",
    profession: "",
    bio: "",
    linkedin: "",
    alternative_email: "",
    photo_url: "",
    telefone: "",
    tem_whatsapp: false,
    phone_verified: false,
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
        profession: currentUser.profession || "",
        bio: currentUser.bio || "",
        linkedin: currentUser.linkedin || "",
        alternative_email: currentUser.alternative_email || "",
        photo_url: currentUser.photo_url || "",
        telefone: currentUser.telefone || "",
        tem_whatsapp: currentUser.tem_whatsapp || false,
        phone_verified: currentUser.phone_verified || false,
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

  const handleCepBlur = async () => {
    const cep = formData.endereco_cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco_rua: data.logradouro,
            endereco_bairro: data.bairro,
            endereco_cidade: data.localidade,
            endereco_estado: data.uf
          }));
        } else {
          alert('CEP não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao enviar foto");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleWebcamCapture = async (file) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
      setShowWebcam(false);
    } catch (error) {
      console.error("Erro ao enviar foto da webcam:", error);
      alert("Erro ao enviar foto");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSendVerification = async () => {
    if (!formData.telefone) {
        alert("Preencha o telefone primeiro");
        return;
    }
    setIsVerifying(true);
    try {
        const { demo_code } = await base44.functions.invoke("sendPhoneVerification", { phone: formData.telefone });
        setShowPhoneVerify(true);
        if (demo_code) alert(`Código de demonstração: ${demo_code}`);
    } catch (e) {
        console.error(e);
        alert("Erro ao enviar código");
    } finally {
        setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsVerifying(true);
    try {
        await base44.functions.invoke("verifyPhoneCode", { code: verificationCode });
        setFormData(prev => ({ ...prev, phone_verified: true }));
        setShowPhoneVerify(false);
        alert("Telefone verificado com sucesso!");
    } catch (e) {
        console.error(e);
        alert("Código inválido");
    } finally {
        setIsVerifying(false);
    }
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

        {/* Foto de Perfil */}
        <div className="flex justify-center mb-6">
          <div className="flex flex-col items-center gap-3">
              <div className="relative group">
              {formData.photo_url ? (
                  <>
                  <img 
                      src={formData.photo_url} 
                      alt="Foto Perfil" 
                      className="w-32 h-32 object-cover rounded-full shadow-lg border-4 border-white bg-gray-100" 
                  />
                  <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-8 w-8 rounded-full shadow-md"
                      onClick={() => setFormData({...formData, photo_url: ""})}
                  >
                      <X className="w-4 h-4" />
                  </Button>
                  </>
              ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                  <User className="w-16 h-16 opacity-50" />
                  </div>
              )}

              <div className="absolute bottom-0 -right-2 flex gap-2">
                  <Button
                      type="button"
                      size="icon"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
                      onClick={() => setShowWebcam(true)}
                      title="Tirar foto com a câmera"
                  >
                      <Camera className="w-4 h-4" />
                  </Button>
                  <div className="relative">
                      <Label htmlFor="foto-upload" className="cursor-pointer block">
                          <div className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg transition-colors">
                          {isUploadingPhoto ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                              <Upload className="w-4 h-4" />
                          )}
                          </div>
                      </Label>
                      <Input
                          id="foto-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploadingPhoto}
                      />
                  </div>
              </div>
              </div>
              <span className="text-sm text-gray-500 font-medium">Sua Foto de Perfil</span>
          </div>
        </div>
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
              
              <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profession">Profissão</Label>
                    <Input
                        id="profession"
                        value={formData.profession}
                        onChange={(e) => handleChange("profession", e.target.value)}
                        placeholder="Ex: Médico Cardiologista"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={(e) => handleChange("linkedin", e.target.value)}
                        placeholder="URL do seu perfil"
                    />
                  </div>
              </div>

              <div>
                <Label htmlFor="bio">Biografia / Resumo Profissional</Label>
                <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                    placeholder="Conte um pouco sobre sua experiência..."
                    rows={3}
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
                <div className="flex gap-2">
                    <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleChange("telefone", e.target.value)}
                        placeholder="(00) 00000-0000"
                    />
                    {formData.phone_verified ? (
                        <div className="flex items-center gap-2 text-green-600 px-3 py-2 bg-green-50 rounded-md border border-green-200">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-sm font-medium whitespace-nowrap">Verificado</span>
                        </div>
                    ) : (
                        <Button 
                            type="button" 
                            variant="outline"
                            onClick={handleSendVerification}
                            disabled={isVerifying || !formData.telefone}
                        >
                            {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
                        </Button>
                    )}
                </div>
              </div>

              <div>
                <Label htmlFor="alternative_email">E-mail Alternativo</Label>
                <Input
                  id="alternative_email"
                  type="email"
                  value={formData.alternative_email}
                  onChange={(e) => handleChange("alternative_email", e.target.value)}
                  placeholder="seu.email@exemplo.com"
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
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <p className="text-xs text-gray-500 mt-1">Digite o CEP para preencher automaticamente</p>
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

      <Dialog open={showWebcam} onOpenChange={setShowWebcam}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Tirar Foto</DialogTitle>
            </DialogHeader>
            <WebcamCapture 
                onCapture={handleWebcamCapture}
                onCancel={() => setShowWebcam(false)}
            />
        </DialogContent>
      </Dialog>

      <Dialog open={showPhoneVerify} onOpenChange={setShowPhoneVerify}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Verificar Telefone</DialogTitle>
                <DialogDescription>
                    Digite o código enviado para {formData.telefone}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Input 
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Código de 6 dígitos"
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                />
                <Button onClick={handleVerifyCode} className="w-full" disabled={isVerifying}>
                    {isVerifying ? <Loader2 className="animate-spin" /> : "Confirmar Código"}
                </Button>
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}