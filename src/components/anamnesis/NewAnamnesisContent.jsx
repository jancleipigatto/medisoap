import React, { useState, useEffect } from "react";
import { Anamnesis } from "@/entities/Anamnesis";
// This import is kept for entity definition, but actual loading will be in PatientSelector
import { AnamnesisTemplate } from "@/entities/AnamnesisTemplate";
import { InvokeLLM } from "@/integrations/Core";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Sparkles, Loader2, FileText, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PatientSelector from "./PatientSelector";
import ToolsSidebar from "../tools/ToolsSidebar";
import GestationalAgeCalculator from "../tools/GestationalAgeCalculator";
import BMICalculator from "../tools/BMICalculator";
import { AnimatePresence } from "framer-motion";

export default function NewAnamnesisContent() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0]);
  const [textoOriginal, setTextoOriginal] = useState("");
  const [soapData, setSoapData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [currentAnamnesisId, setCurrentAnamnesisId] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await AnamnesisTemplate.list("-created_date");
    setTemplates(data);
    
    // Carregar modelo padrão automaticamente
    const defaultTemplate = data.find(t => t.is_default);
    if (defaultTemplate) {
      setTextoOriginal(defaultTemplate.template_texto);
      setSelectedTemplate(defaultTemplate.id);
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTextoOriginal(template.template_texto);
    } else if (templateId === "none") { // Clear text if "Nenhum modelo" is selected
      setTextoOriginal("");
    }
  };

  const convertToSOAP = async () => {
    if (!textoOriginal.trim()) {
      alert("Por favor, digite o texto da anamnese");
      return;
    }

    setIsProcessing(true);
    
    const prompt = `Você é um assistente médico especializado. Analise o seguinte texto de uma anamnese médica e organize-o no formato SOAP (Subjetivo, Objetivo, Avaliação, Plano).

IMPORTANTE: Preserve TODA a formatação original do texto, incluindo quebras de linha, espaçamentos, bullets, hífens e estruturas. NÃO consolide tudo em uma única linha.

Texto da anamnese:
${textoOriginal}

Organize as informações nos seguintes campos, mantendo a formatação exata do texto original:
- Subjetivo (S): Queixas, sintomas e história relatada pelo paciente
- Objetivo (O): Sinais vitais, exame físico, dados mensuráveis e observáveis  
- Avaliação (A): Diagnóstico, hipóteses diagnósticas, impressão clínica
- Plano (P): Tratamento proposto, medicações, exames solicitados, orientações

Mantenha quebras de linha, bullets (- ou •), e toda estrutura de formatação presente no texto original.
Se alguma seção não tiver informação no texto, deixe em branco ou indique "Não informado".`;

    const result = await InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          subjetivo: { type: "string" },
          objetivo: { type: "string" },
          avaliacao: { type: "string" },
          plano: { type: "string" }
        }
      }
    });

    setSoapData(result);
    setIsProcessing(false);
  };

  const generateSOAPText = () => {
    if (!soapData) return "";
    
    return `ANAMNESE - FORMATO SOAP

S - SUBJETIVO:
${soapData.subjetivo}

O - OBJETIVO:
${soapData.objetivo}

A - AVALIAÇÃO:
${soapData.avaliacao}

P - PLANO:
${soapData.plano}`;
  };

  const copySOAPText = async () => {
    const text = generateSOAPText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateAttendanceNumber = async (date) => {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const dateStr = `${day}${month}${year}`;
    
    // Buscar atendimentos do mesmo dia
    const allAnamneses = await Anamnesis.list();
    const sameDay = allAnamneses.filter(a => {
      if (!a.numero_atendimento) return false;
      return a.numero_atendimento.endsWith(dateStr);
    });
    
    const nextNumber = sameDay.length + 1;
    return `${nextNumber}_${dateStr}`;
  };

  const saveAnamnesisWithoutSOAP = async () => {
    if (!selectedPatient) {
      alert("Por favor, selecione um paciente");
      return;
    }

    if (!textoOriginal.trim()) {
      alert("Por favor, digite o texto da anamnese");
      return;
    }

    setIsSaving(true);

    if (currentAnamnesisId) {
      // Atualizar anamnese existente
      await Anamnesis.update(currentAnamnesisId, {
        patient_id: selectedPatient.id,
        patient_name: selectedPatient.nome,
        data_consulta: dataConsulta,
        texto_original: textoOriginal
      });
    } else {
      // Criar nova anamnese com número de atendimento
      const numeroAtendimento = await generateAttendanceNumber(dataConsulta);
      const created = await Anamnesis.create({
        patient_id: selectedPatient.id,
        patient_name: selectedPatient.nome,
        data_consulta: dataConsulta,
        texto_original: textoOriginal,
        numero_atendimento: numeroAtendimento,
        subjetivo: "",
        objetivo: "",
        avaliacao: "",
        plano: ""
      });
      setCurrentAnamnesisId(created.id);
    }

    setIsSaving(false);
    alert("Anamnese salva com sucesso!");
  };

  const finalizeAnamnesis = async () => {
    if (!selectedPatient) {
      alert("Por favor, selecione um paciente");
      return;
    }

    // Se não tem SOAP, converter primeiro
    if (!soapData) {
      await convertToSOAP();
      return;
    }

    setIsSaving(true);

    const anamnesisData = {
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.nome,
      data_consulta: dataConsulta,
      texto_original: textoOriginal,
      ...soapData
    };

    if (currentAnamnesisId) {
      await Anamnesis.update(currentAnamnesisId, anamnesisData);
    } else {
      const numeroAtendimento = await generateAttendanceNumber(dataConsulta);
      const created = await Anamnesis.create({
        ...anamnesisData,
        numero_atendimento: numeroAtendimento
      });
      setCurrentAnamnesisId(created.id);
    }

    setIsSaving(false);
    setIsFinalized(true);
  };

  const addDetails = () => {
    if (currentAnamnesisId) {
      window.location.href = createPageUrl(`AnamnesisDetail?id=${currentAnamnesisId}`);
    }
  };

  const handleToolSave = (toolResult) => {
    // Adicionar resultado da ferramenta ao texto original
    const updatedText = textoOriginal + "\n\n" + toolResult;
    setTextoOriginal(updatedText);
    
    // Fechar ferramenta
    setActiveTool(null);
  };

  useEffect(() => {
    // Verificar se estamos continuando um atendimento ou copiando
    const urlParams = new URLSearchParams(window.location.search);
    const continueId = urlParams.get('continue');
    const copyText = urlParams.get('copyText');
    
    if (continueId) {
      loadExistingAnamnesis(continueId);
    } else if (copyText) {
      setTextoOriginal(decodeURIComponent(copyText));
    }
  }, []);

  const loadExistingAnamnesis = async (id) => {
    const data = await Anamnesis.list();
    const anamnesis = data.find(a => a.id === id);
    
    if (anamnesis) {
      setCurrentAnamnesisId(id);
      setSelectedPatient({ id: anamnesis.patient_id, nome: anamnesis.patient_name });
      setDataConsulta(anamnesis.data_consulta);
      setTextoOriginal(anamnesis.texto_original || "");
      
      if (anamnesis.subjetivo || anamnesis.objetivo || anamnesis.avaliacao || anamnesis.plano) {
        setSoapData({
          subjetivo: anamnesis.subjetivo || "",
          objetivo: anamnesis.objetivo || "",
          avaliacao: anamnesis.avaliacao || "",
          plano: anamnesis.plano || ""
        });
      }
    }
  };

  return (
    <>
      <ToolsSidebar onToolOpen={setActiveTool} />
      
      <AnimatePresence>
        {activeTool === 'gestational_age' && (
          <GestationalAgeCalculator 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
        {activeTool === 'bmi' && (
          <BMICalculator 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
      </AnimatePresence>

      <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen pr-36">
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
            <h1 className="text-3xl font-bold text-gray-900">Nova Anamnese</h1>
            <p className="text-gray-600 mt-1">Digite ou cole o texto da consulta</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Informações da Consulta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PatientSelector
                selectedPatient={selectedPatient}
                onSelect={setSelectedPatient}
              />

              {selectedPatient && (
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(createPageUrl(`Patients?edit=${selectedPatient.id}`), '_blank');
                    }}
                  >
                    Editar Paciente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(createPageUrl(`Patients?new=true`), '_blank');
                    }}
                  >
                    Novo Paciente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(createPageUrl(`PatientHistory?patientId=${selectedPatient.id}`), '_blank');
                    }}
                  >
                    Histórico
                  </Button>
                </div>
              )}

              {!selectedPatient && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(createPageUrl(`Patients?new=true`), '_blank');
                  }}
                  className="w-full"
                >
                  Criar Novo Paciente
                </Button>
              )}

              <div>
                <Label htmlFor="data">Data da Consulta</Label>
                <Input
                  id="data"
                  type="date"
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                />
              </div>

              {templates.length > 0 && (
                <div>
                  <Label htmlFor="template">Usar Modelo (Opcional)</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum modelo</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Texto da Anamnese</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Digite ou cole aqui o texto da conversa com o paciente. Exemplo:&#10;&#10;Paciente relata dor de cabeça há 3 dias, pior pela manhã. Nega febre. PA: 130/80, FC: 72bpm. Paciente lúcido e orientado. Hipótese: Cefaleia tensional. Prescrever analgésico e retorno em 7 dias."
                value={textoOriginal}
                onChange={(e) => setTextoOriginal(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex flex-col gap-3 mt-4">
                <Button
                  onClick={saveAnamnesisWithoutSOAP}
                  disabled={isSaving || !textoOriginal.trim() || !selectedPatient}
                  variant="outline"
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Anamnese"
                  )}
                </Button>
                <Button
                  onClick={convertToSOAP}
                  disabled={isProcessing || !textoOriginal.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Convertendo para SOAP...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Converter para SOAP com IA
                    </>
                  )}
                </Button>
                {currentAnamnesisId && !soapData && (
                  <Button
                    onClick={finalizeAnamnesis}
                    disabled={isProcessing || isSaving || !textoOriginal.trim()}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    Finalizar Atendimento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {soapData && (
            <>
              <Card className="shadow-lg border-none bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      Texto Convertido para Modelo
                    </CardTitle>
                    <Button
                      onClick={copySOAPText}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={generateSOAPText()}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      const sections = {
                        subjetivo: [],
                        objetivo: [],
                        avaliacao: [],
                        plano: []
                      };
                      let currentSection = null;
                      
                      lines.forEach(line => {
                        if (line.includes('S - SUBJETIVO:')) currentSection = 'subjetivo';
                        else if (line.includes('O - OBJETIVO:')) currentSection = 'objetivo';
                        else if (line.includes('A - AVALIAÇÃO:')) currentSection = 'avaliacao';
                        else if (line.includes('P - PLANO:')) currentSection = 'plano';
                        else if (currentSection && line.trim()) {
                          sections[currentSection].push(line);
                        }
                      });
                      
                      setSoapData({
                        subjetivo: sections.subjetivo.join('\n'),
                        objetivo: sections.objetivo.join('\n'),
                        avaliacao: sections.avaliacao.join('\n'),
                        plano: sections.plano.join('\n')
                      });
                    }}
                    className="min-h-[300px] font-mono text-sm bg-white"
                  />
                  <Alert className="mt-4 bg-blue-50 border-blue-200">
                    <AlertDescription>
                      Use o botão "Copiar" acima para copiar todo o texto formatado e colar em outro sistema.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Formato SOAP - Campos Editáveis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold text-green-700">S - Subjetivo</Label>
                    <Textarea
                      value={soapData.subjetivo}
                      onChange={(e) => setSoapData({...soapData, subjetivo: e.target.value})}
                      className="mt-2 bg-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-lg font-semibold text-blue-700">O - Objetivo</Label>
                    <Textarea
                      value={soapData.objetivo}
                      onChange={(e) => setSoapData({...soapData, objetivo: e.target.value})}
                      className="mt-2 bg-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-lg font-semibold text-purple-700">A - Avaliação</Label>
                    <Textarea
                      value={soapData.avaliacao}
                      onChange={(e) => setSoapData({...soapData, avaliacao: e.target.value})}
                      className="mt-2 bg-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-lg font-semibold text-orange-700">P - Plano</Label>
                    <Textarea
                      value={soapData.plano}
                      onChange={(e) => setSoapData({...soapData, plano: e.target.value})}
                      className="mt-2 bg-white"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={finalizeAnamnesis}
                    disabled={isSaving || isFinalized}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      "Finalizar Atendimento"
                    )}
                  </Button>

                  {isFinalized && (
                    <Button
                      onClick={addDetails}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      Adicionar Detalhes
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
        </div>
      </div>
    </>
  );
}