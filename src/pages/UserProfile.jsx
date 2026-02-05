import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Camera, Upload, X, ShieldCheck, User as UserIcon } from "lucide-react";
import WebcamCapture from "@/components/common/WebcamCapture";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfile() {
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
    full_name: "",
    email: "",
    profession: "",
    bio: "",
    linkedin: "",
    alternative_email: "",
    photo_url: "",
    telefone: "",
    tem_whatsapp: false,
    phone_verified: false,
    // Add other fields if needed for display/edit
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
      email: currentUser.email || "",
      profession: currentUser.profession || "",
      bio: currentUser.bio || "",
      linkedin: currentUser.linkedin || "",
      alternative_email: currentUser.alternative_email || "",
      photo_url: currentUser.photo_url || "",
      telefone: currentUser.telefone || "",
      tem_whatsapp: currentUser.tem_whatsapp || false,
      phone_verified: currentUser.phone_verified || false,
    });
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await User.updateMe({
      full_name: formData.full_name,
      profession: formData.profession,
      bio: formData.bio,
      linkedin: formData.linkedin,
      alternative_email: formData.alternative_email,
      photo_url: formData.photo_url,
      telefone: formData.telefone,
      tem_whatsapp: formData.tem_whatsapp,
      phone_verified: formData.phone_verified
    });
    setIsSaving(false);
    alert("Dados atualizados com sucesso!");
    navigate(createPageUrl("Home"));
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
          <CardContent className="space-y-6">
            
            {/* Photo */}
            <div className="flex justify-center mb-2">
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
                        <UserIcon className="w-16 h-16 opacity-50" />
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
                            <Label htmlFor="foto-upload-profile" className="cursor-pointer block">
                                <div className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg transition-colors">
                                {isUploadingPhoto ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                </div>
                            </Label>
                            <Input
                                id="foto-upload-profile"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isUploadingPhoto}
                            />
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="profession">Profissão</Label>
                    <Input
                        id="profession"
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        placeholder="Ex: Médico Cardiologista"
                    />
                </div>
                <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="URL do LinkedIn"
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Resumo profissional"
                    rows={2}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="alternative_email">E-mail Alternativo</Label>
                    <Input
                        id="alternative_email"
                        value={formData.alternative_email}
                        onChange={(e) => setFormData({ ...formData, alternative_email: e.target.value })}
                    />
                </div>
                <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <div className="flex gap-2">
                        <Input
                            id="telefone"
                            value={formData.telefone}
                            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        />
                         {formData.phone_verified ? (
                            <div className="flex items-center gap-2 text-green-600 px-3 py-2 bg-green-50 rounded-md border border-green-200" title="Verificado">
                                <ShieldCheck className="w-5 h-5" />
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