import React, { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PatientSelector from "./PatientSelector";
import ToolsSidebar from "../tools/ToolsSidebar";
import GestationalAgeCalculator from "../tools/GestationalAgeCalculator";
import BMICalculator from "../tools/BMICalculator";
import CIDAutocomplete from "../medical/CIDAutocomplete";
import { AnimatePresence } from "framer-motion";

export default function NewAnamnesisContent() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [dataConsulta, setDataConsulta] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [textoOriginal, setTextoOriginal] = useState("");
  const [soapData, setSoapData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [currentAnamnesisId, setCurrentAnamnesisId] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [showCidDialog, setShowCidDialog] = useState(false);
  const [cidText, setCidText] = useState("");
  const [appSettings, setAppSettings] = useState(null);

  useEffect(() => {
    loadTemplates();
    loadAppSettings();
  }, []);

  const loadAppSettings = async () => {
    const settings = await base44.entities.AppSettings.list();
    if (settings.length > 0) {
      setAppSettings(settings[0]);
    }
  };

  const loadTemplates = async () => {
    const data = await base44.entities.AnamnesisTemplate.list("-created_date");
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

  const convertToSOAP = async (useTemplate = false) => {
    if (!textoOriginal.trim()) {
      alert("Por favor, digite o texto do atendimento");
      return;
    }

    setIsProcessing(true);
    
    let prompt = appSettings?.prompt_prontuario || `Você é um assistente médico especializado. Analise o seguinte texto de um atendimento médico e organize-o no formato SOAP (Subjetivo, Objetivo, Avaliação, Plano).

IMPORTANTE: Preserve TODA a formatação original do texto, incluindo quebras de linha, espaçamentos, bullets, hífens e estruturas. NÃO consolide tudo em uma única linha.

Texto do atendimento:
${textoOriginal}

Organize as informações nos seguintes campos, mantendo a formatação exata do texto original:
- Subjetivo (S): Queixas, sintomas e história relatada pelo paciente
- Objetivo (O): Sinais vitais, exame físico, dados mensuráveis e observáveis  
- Avaliação (A): Diagnóstico, hipóteses diagnósticas, impressão clínica
- Plano (P): Tratamento proposto, medicações, exames solicitados, orientações

Mantenha quebras de linha, bullets (- ou •), e toda estrutura de formatação presente no texto original.
Se alguma seção não tiver informação no texto, deixe em branco ou indique "Não informado".`;

    // Se está usando template, adicionar o template ao prompt
    if (useTemplate && selectedTemplate && selectedTemplate !== "none") {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        prompt = `${prompt}\n\nUse o seguinte modelo como referência para estruturar a resposta:\n${template.template_texto}`;
      }
    }

    const result = await base44.integrations.Core.InvokeLLM({
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
    
    return `ATENDIMENTO - FORMATO SOAP

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
    const allAnamneses = await base44.entities.Anamnesis.list();
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
      alert("Por favor, digite o texto do atendimento");
      return;
    }

    setIsSaving(true);

    if (currentAnamnesisId) {
      // Atualizar anamnese existente
      await base44.entities.Anamnesis.update(currentAnamnesisId, {
        patient_id: selectedPatient.id,
        patient_name: selectedPatient.nome,
        data_consulta: dataConsulta,
        texto_original: textoOriginal
      });
    } else {
      // Criar nova anamnese com número de atendimento
      const numeroAtendimento = await generateAttendanceNumber(dataConsulta);
      const created = await base44.entities.Anamnesis.create({
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
    alert("Atendimento salvo com sucesso!");
  };

  const finalizeAnamnesis = async () => {
    if (!selectedPatient) {
      alert("Por favor, selecione um paciente");
      return;
    }

    if (!textoOriginal.trim()) {
      alert("Por favor, digite o texto do atendimento");
      return;
    }

    if (!cidText.trim()) {
      alert("Por favor, inclua o CID antes de finalizar o atendimento");
      return;
    }

    setIsSaving(true);

    const anamnesisData = {
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.nome,
      data_consulta: dataConsulta,
      texto_original: textoOriginal,
      subjetivo: soapData?.subjetivo || "",
      objetivo: soapData?.objetivo || "",
      avaliacao: (soapData?.avaliacao || "") + (cidText ? `\n\nCID: ${cidText}` : ""),
      plano: soapData?.plano || ""
    };

    let savedId = currentAnamnesisId;

    if (currentAnamnesisId) {
      await base44.entities.Anamnesis.update(currentAnamnesisId, anamnesisData);
    } else {
      const numeroAtendimento = await generateAttendanceNumber(dataConsulta);
      const created = await base44.entities.Anamnesis.create({
        ...anamnesisData,
        numero_atendimento: numeroAtendimento
      });
      savedId = created.id;
      setCurrentAnamnesisId(savedId);
    }

    setIsSaving(false);
    setIsFinalized(true);
    
    // Redirecionar para saída de atendimento
    window.location.href = createPageUrl(`AnamnesisDetail?id=${savedId}`);
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
    const data = await base44.entities.Anamnesis.list();
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
            <h1 className="text-2xl font-bold text-gray-900">Novo Atendimento</h1>
            <p className="text-sm text-gray-600 mt-1">Digite ou cole o texto da consulta</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-base">Informações da Consulta</CardTitle>
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
                    className="text-sm h-9"
                    onClick={() => {
                      window.open(createPageUrl(`Patients?edit=${selectedPatient.id}`), '_blank');
                    }}
                  >
                    Editar Paciente
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm h-9"
                    onClick={() => {
                      window.open(createPageUrl(`Patients?new=true`), '_blank');
                    }}
                  >
                    Novo Paciente
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm h-9"
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
                  onClick={() => {
                    window.open(createPageUrl(`Patients?new=true`), '_blank');
                  }}
                  className="w-full text-sm h-9"
                >
                  Criar Novo Paciente
                </Button>
              )}

              <div>
                <Label htmlFor="data" className="text-sm">Data da Consulta</Label>
                <Input
                  id="data"
                  type="date"
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                  className="text-sm h-9"
                />
              </div>

              {templates.length > 0 && (
                <div>
                  <Label htmlFor="template" className="text-sm">Usar Modelo (Opcional)</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger id="template" className="text-sm h-9">
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
              <CardTitle className="text-base">Atendimento</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Digite ou cole aqui o texto da conversa com o paciente. Exemplo:&#10;&#10;Paciente relata dor de cabeça há 3 dias, pior pela manhã. Nega febre. PA: 130/80, FC: 72bpm. Paciente lúcido e orientado. Hipótese: Cefaleia tensional. Prescrever analgésico e retorno em 7 dias."
                value={textoOriginal}
                onChange={(e) => setTextoOriginal(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="mt-4">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => setShowCidDialog(true)}
                    variant="outline"
                    className="flex-1 min-w-[140px] text-sm h-9"
                  >
                    {cidText ? `CID: ${cidText}` : "Incluir CID"}
                  </Button>
                  <Button
                    onClick={saveAnamnesisWithoutSOAP}
                    disabled={isSaving || !textoOriginal.trim() || !selectedPatient}
                    variant="outline"
                    className="flex-1 min-w-[140px] text-sm h-9"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                  <Button
                    onClick={() => convertToSOAP(true)}
                    disabled={isProcessing || !textoOriginal.trim()}
                    variant="outline"
                    className="flex-1 min-w-[140px] text-sm h-9"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Convertendo...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Converter Modelo
                      </>
                    )}
                  </Button>
                  {templates.length > 0 && (
                    <Select
                      value={selectedTemplate}
                      onValueChange={setSelectedTemplate}
                      disabled={isProcessing}
                    >
                      <SelectTrigger className="flex-1 min-w-[140px] h-9 text-sm">
                        <SelectValue placeholder="Modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    onClick={finalizeAnamnesis}
                    disabled={isSaving || !textoOriginal.trim() || !selectedPatient || !cidText.trim()}
                    className="flex-1 min-w-[140px] text-sm h-9 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      "Finalizar"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {soapData && (
            <>
              <Card className="shadow-lg border-none bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-5 h-5 text-orange-600" />
                      Prontuário - IA
                    </CardTitle>
                    <Button
                      onClick={copySOAPText}
                      variant="outline"
                      className="gap-2 text-sm h-9"
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
                      Use o botão "Copiar" acima para copiar todo o texto formatado.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {isFinalized && (
                <Button
                  onClick={addDetails}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-sm h-9"
                >
                  Saída de Atendimento
                </Button>
              )}
            </>
          )}

          {!soapData && isFinalized && (
            <Button
              onClick={addDetails}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-sm h-9"
            >
              Saída de Atendimento
            </Button>
          )}
        </div>
        </div>
      </div>

      <Dialog open={showCidDialog} onOpenChange={setShowCidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">Incluir CID</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cid" className="text-sm">CID da Consulta</Label>
              <div className="mt-2">
                <CIDAutocomplete
                  value={cidText}
                  onSelect={setCidText}
                  placeholder="Buscar CID por código ou descrição..."
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCidDialog(false)} className="text-sm h-9">
              Cancelar
            </Button>
            <Button onClick={() => setShowCidDialog(false)} className="text-sm h-9">
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}