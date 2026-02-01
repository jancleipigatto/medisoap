import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Patient } from "@/entities/Patient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Upload, X, User, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PatientFormDialog({ open, onOpenChange, patientToEdit, onSuccess }) {
  const [convenios, setConvenios] = useState([]);
  const [paises, setPaises] = useState([]);
  const [formData, setFormData] = useState({
    nome: "",
    data_nascimento: "",
    cpf: "",
    telefone: "",
    email: "",
    nacionalidade: "Brasileira",
    convenio: "",
    endereco_rua: "",
    endereco_numero: "",
    endereco_complemento: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_estado: "",
    endereco_cep: "",
    comorbidades: "",
    medicamentos_uso_continuo: "",
    observacoes: "",
    is_favorite: false,
    foto_url: ""
  });
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    loadConvenios();
    loadPaises();
  }, []);

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        nome: patientToEdit.nome || "",
        data_nascimento: patientToEdit.data_nascimento || "",
        cpf: patientToEdit.cpf || "",
        telefone: patientToEdit.telefone || "",
        email: patientToEdit.email || "",
        nacionalidade: patientToEdit.nacionalidade || "Brasileira",
        convenio: patientToEdit.convenio || "",
        endereco_rua: patientToEdit.endereco_rua || "",
        endereco_numero: patientToEdit.endereco_numero || "",
        endereco_complemento: patientToEdit.endereco_complemento || "",
        endereco_bairro: patientToEdit.endereco_bairro || "",
        endereco_cidade: patientToEdit.endereco_cidade || "",
        endereco_estado: patientToEdit.endereco_estado || "",
        endereco_cep: patientToEdit.endereco_cep || "",
        comorbidades: patientToEdit.comorbidades || "",
        medicamentos_uso_continuo: patientToEdit.medicamentos_uso_continuo || "",
        observacoes: patientToEdit.observacoes || "",
        is_favorite: patientToEdit.is_favorite || false,
        foto_url: patientToEdit.foto_url || ""
      });
    } else {
      setFormData({
        nome: "",
        data_nascimento: "",
        cpf: "",
        telefone: "",
        email: "",
        nacionalidade: "Brasileira",
        convenio: "",
        endereco_rua: "",
        endereco_numero: "",
        endereco_complemento: "",
        endereco_bairro: "",
        endereco_cidade: "",
        endereco_estado: "",
        endereco_cep: "",
        comorbidades: "",
        medicamentos_uso_continuo: "",
        observacoes: "",
        is_favorite: false,
        foto_url: ""
      });
    }
  }, [patientToEdit, open]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, foto_url: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao enviar foto");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const loadConvenios = async () => {
    const data = await base44.entities.Convenio.list("nome");
    setConvenios(data);
  };

  const loadPaises = async () => {
    try {
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/paises');
      const data = await response.json();
      const sorted = data.sort((a, b) => a.nome.localeCompare(b.nome));
      setPaises(sorted);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (patientToEdit) {
        await Patient.update(patientToEdit.id, formData);
      } else {
        await Patient.create(formData);
      }
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar paciente:", error);
      alert("Erro ao salvar paciente. Verifique os dados.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {patientToEdit ? "Atualizar Dados do Paciente" : "Novo Paciente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex justify-center mb-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                {formData.foto_url ? (
                  <>
                    <img 
                      src={formData.foto_url} 
                      alt="Foto Paciente" 
                      className="w-32 h-32 object-cover rounded-full shadow-lg border-4 border-white bg-gray-100" 
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-8 w-8 rounded-full shadow-md"
                      onClick={() => setFormData({...formData, foto_url: ""})}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                    <User className="w-16 h-16 opacity-50" />
                  </div>
                )}
                
                <div className="absolute bottom-0 right-0">
                  <Label htmlFor="foto-upload" className="cursor-pointer">
                    <div className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors">
                      {isUploadingPhoto ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
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
              <span className="text-sm text-gray-500 font-medium">Foto do Paciente</span>
            </div>
          </div>

          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nacionalidade">Nacionalidade</Label>
              <Select
                value={formData.nacionalidade}
                onValueChange={(value) => setFormData({...formData, nacionalidade: value})}
              >
                <SelectTrigger id="nacionalidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brasileira">Brasileira</SelectItem>
                  {paises.map((pais) => (
                    <SelectItem key={pais.id['ISO-3166-1-ALPHA-3']} value={pais.nome}>
                      {pais.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="convenio">Convênio</Label>
              <Select
                value={formData.convenio}
                onValueChange={(value) => setFormData({...formData, convenio: value})}
              >
                <SelectTrigger id="convenio">
                  <SelectValue placeholder="Selecione ou digite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Particular">Particular</SelectItem>
                  {convenios.map((conv) => (
                    <SelectItem key={conv.id} value={conv.nome}>
                      {conv.nome}
                    </SelectItem>
                  ))}
                  <SelectItem value="__outro__">Outro (Digite abaixo)</SelectItem>
                </SelectContent>
              </Select>
              {formData.convenio === "__outro__" && (
                <Input
                  className="mt-2"
                  placeholder="Digite o nome do convênio"
                  onChange={(e) => setFormData({...formData, convenio: e.target.value})}
                />
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="endereco_cep">CEP</Label>
                <Input
                  id="endereco_cep"
                  maxLength={8}
                  value={formData.endereco_cep}
                  onChange={(e) => setFormData({...formData, endereco_cep: e.target.value})}
                  onBlur={async () => {
                    const cep = formData.endereco_cep.replace(/\D/g, '');
                    if (cep.length === 8) {
                      try {
                        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                        const data = await response.json();
                        if (!data.erro) {
                          setFormData({
                            ...formData,
                            endereco_rua: data.logradouro,
                            endereco_bairro: data.bairro,
                            endereco_cidade: data.localidade,
                            endereco_estado: data.uf
                          });
                        } else {
                          alert('CEP não encontrado.');
                        }
                      } catch (error) {
                        console.error('Erro ao buscar CEP:', error);
                      }
                    }
                  }}
                  placeholder="00000000"
                />
                <p className="text-xs text-gray-500 mt-1">Digite o CEP para preencher automaticamente</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="endereco_rua">Rua/Avenida</Label>
                  <Input
                    id="endereco_rua"
                    value={formData.endereco_rua}
                    onChange={(e) => setFormData({...formData, endereco_rua: e.target.value})}
                    placeholder="Nome da rua"
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_numero">Número</Label>
                  <Input
                    id="endereco_numero"
                    value={formData.endereco_numero}
                    onChange={(e) => setFormData({...formData, endereco_numero: e.target.value})}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endereco_complemento">Complemento</Label>
                  <Input
                    id="endereco_complemento"
                    value={formData.endereco_complemento}
                    onChange={(e) => setFormData({...formData, endereco_complemento: e.target.value})}
                    placeholder="Apto, Bloco, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_bairro">Bairro</Label>
                  <Input
                    id="endereco_bairro"
                    value={formData.endereco_bairro}
                    onChange={(e) => setFormData({...formData, endereco_bairro: e.target.value})}
                    placeholder="Nome do bairro"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endereco_cidade">Cidade</Label>
                  <Input
                    id="endereco_cidade"
                    value={formData.endereco_cidade}
                    onChange={(e) => setFormData({...formData, endereco_cidade: e.target.value})}
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_estado">Estado</Label>
                  <Input
                    id="endereco_estado"
                    value={formData.endereco_estado}
                    onChange={(e) => setFormData({...formData, endereco_estado: e.target.value.toUpperCase()})}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              {patientToEdit ? "Atualizar" : "Salvar"} Paciente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}