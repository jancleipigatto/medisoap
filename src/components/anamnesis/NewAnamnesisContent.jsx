import React, { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Sparkles, Loader2, FileText, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PatientSelector from "./PatientSelector";
import ToolsSidebar from "../tools/ToolsSidebar";
import DocumentsSidebar from "../medical/DocumentsSidebar";
import GestationalAgeCalculator from "../tools/GestationalAgeCalculator";
import BMICalculator from "../tools/BMICalculator";
import FloatingDocument from "../medical/FloatingDocument";
import DocumentForm from "../medical/DocumentForm";
import ReceitaFormAdvanced from "../medical/ReceitaFormAdvanced";
import { AnimatePresence } from "framer-motion";
import { Star, X, Activity, ClipboardList, FileCheck, Send, Info, Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AtestadoTemplate } from "@/entities/AtestadoTemplate";
import { ExameTemplate } from "@/entities/ExameTemplate";
import { EncaminhamentoTemplate } from "@/entities/EncaminhamentoTemplate";

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
  const [horarioConsulta, setHorarioConsulta] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [textoOriginal, setTextoOriginal] = useState("");
  const [soapData, setSoapData] = useState(null);
  const [soapTextContent, setSoapTextContent] = useState(""); // Estado para o texto do editor do SOAP
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [currentAnamnesisId, setCurrentAnamnesisId] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [showCidDialog, setShowCidDialog] = useState(false);
  const [cidText, setCidText] = useState("");
  const [appSettings, setAppSettings] = useState(null);
  const [cids, setCids] = useState([]);
  const [cidSearchTerm, setCidSearchTerm] = useState("");
  const [selectedCids, setSelectedCids] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [anamnesis, setAnamnesis] = useState(null);
  const [linkedAppointment, setLinkedAppointment] = useState(null);

  useEffect(() => {
    loadTemplates();
    loadAppSettings();
    loadCIDs();
  }, []);

  const loadAppSettings = async () => {
    const settings = await base44.entities.AppSettings.list();
    if (settings.length > 0) {
      setAppSettings(settings[0]);
    }
  };

  const loadCIDs = async () => {
    const data = await base44.entities.CID.list("-uso_frequente", 5000);
    setCids(data);
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

  // Função auxiliar para parsear o texto SOAP de volta para objeto
  const parseSOAPFromText = (text) => {
    if (!text) return { subjetivo: "", objetivo: "", avaliacao: "", plano: "" };
    
    // Remover tags HTML básicas
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';
    
    const lines = cleanText.split('\n');
    const sections = { subjetivo: [], objetivo: [], avaliacao: [], plano: [] };
    let currentSection = null;
    
    lines.forEach(line => {
      const upper = line.toUpperCase().trim();
      if (upper.includes('S - SUBJETIVO') || upper.includes('SUBJETIVO:')) currentSection = 'subjetivo';
      else if (upper.includes('O - OBJETIVO') || upper.includes('OBJETIVO:')) currentSection = 'objetivo';
      else if (upper.includes('A - AVALIAÇÃO') || upper.includes('AVALIAÇÃO:') || upper.includes('AVALIACAO:')) currentSection = 'avaliacao';
      else if (upper.includes('P - PLANO') || upper.includes('PLANO:')) currentSection = 'plano';
      else if (currentSection && line.trim()) {
        sections[currentSection].push(line);
      }
    });
    
    return {
      subjetivo: sections.subjetivo.join('\n'),
      objetivo: sections.objetivo.join('\n'),
      avaliacao: sections.avaliacao.join('\n'),
      plano: sections.plano.join('\n')
    };
  };

  const convertToSOAP = async (useTemplate = false) => {
    if (!textoOriginal.trim()) {
      alert("Por favor, digite o texto do atendimento");
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Preparar Prompt
      let systemPrompt = appSettings?.prompt_prontuario || `Você é um assistente médico especializado. Analise o seguinte texto de um atendimento médico e organize-o no formato SOAP.`;
      
      // Construir o conteúdo do usuário
      let userContent = `TEXTO DO ATENDIMENTO:\n${textoOriginal}`;

      // Adicionar template se selecionado
      if (useTemplate && selectedTemplate && selectedTemplate !== "none") {
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          userContent = `MODELO DE REFERÊNCIA:\n${template.template_texto}\n\n${userContent}`;
        }
      }

      // Adicionar instrução de formatação JSON se não houver no prompt personalizado
      if (!systemPrompt.includes("JSON")) {
          systemPrompt += `\n\nResponda ESTRITAMENTE com um objeto JSON válido contendo os campos: subjetivo, objetivo, avaliacao, plano. Mantenha a formatação original do texto.`;
      }

      const fullPrompt = `${systemPrompt}\n\n${userContent}`;

      // 2. Chamar LLM
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
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

      // 3. Atualizar Estados
      setSoapData(result);
      
      // Gerar texto formatado inicial
      const formattedText = `ATENDIMENTO - FORMATO SOAP

S - SUBJETIVO:
${result.subjetivo || ''}

O - OBJETIVO:
${result.objetivo || ''}

A - AVALIAÇÃO:
${result.avaliacao || ''}

P - PLANO:
${result.plano || ''}`;

      setSoapTextContent(formattedText);

    } catch (error) {
      console.error("Erro na conversão:", error);
      alert("Ocorreu um erro ao processar o texto. Tente simplificar ou reduzir o tamanho do texto.");
    } finally {
      setIsProcessing(false);
    }
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
      // Adicionar histórico de edição
      const existingAnamnesis = await base44.entities.Anamnesis.list();
      const current = existingAnamnesis.find(a => a.id === currentAnamnesisId);
      const historicoLine = `\n\n--- Atualizado em ${new Date().toLocaleString('pt-BR')} ---\n\n`;
      
      await base44.entities.Anamnesis.update(currentAnamnesisId, {
        patient_id: selectedPatient.id,
        patient_name: selectedPatient.nome,
        data_consulta: dataConsulta,
        horario_consulta: horarioConsulta,
        texto_original: current?.texto_original ? current.texto_original + historicoLine + textoOriginal : textoOriginal
      });
    } else {
      // Criar nova anamnese com número de atendimento
      const numeroAtendimento = await generateAttendanceNumber(dataConsulta);
      const created = await base44.entities.Anamnesis.create({
        patient_id: selectedPatient.id,
        patient_name: selectedPatient.nome,
        data_consulta: dataConsulta,
        horario_consulta: horarioConsulta,
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

    // Adicionar histórico se estiver atualizando
    let finalTextoOriginal = textoOriginal;
    if (currentAnamnesisId) {
      const existingAnamnesis = await base44.entities.Anamnesis.list();
      const current = existingAnamnesis.find(a => a.id === currentAnamnesisId);
      const historicoLine = `\n\n--- Finalizado em ${new Date().toLocaleString('pt-BR')} ---\n\n`;
      finalTextoOriginal = current?.texto_original ? current.texto_original + historicoLine + textoOriginal : textoOriginal;
    }

    // Se o usuário editou o texto do SOAP, parsear novamente para salvar atualizado
    let finalSoapData = soapData;
    if (soapTextContent) {
      const parsed = parseSOAPFromText(soapTextContent);
      if (parsed.subjetivo || parsed.objetivo || parsed.avaliacao || parsed.plano) {
        finalSoapData = parsed;
      }
    }

    const anamnesisData = {
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.nome,
      appointment_id: linkedAppointment?.id || null,
      data_consulta: dataConsulta,
      horario_consulta: horarioConsulta,
      texto_original: finalTextoOriginal,
      subjetivo: finalSoapData?.subjetivo || "",
      objetivo: finalSoapData?.objetivo || "",
      avaliacao: (finalSoapData?.avaliacao || "") + (cidText ? `\n\nCID: ${cidText}` : ""),
      plano: finalSoapData?.plano || ""
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
    
    alert("Atendimento finalizado com sucesso!");
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

    // Check for appointment_id passed for NEW anamnesis
    const appointmentId = urlParams.get('appointment_id');
    if (appointmentId && !continueId) {
        loadAppointmentData(appointmentId);
    }
  }, []);

  const loadAppointmentData = async (id) => {
      try {
          const apps = await base44.entities.Agendamento.list();
          const app = apps.find(a => a.id === id);
          if (app) {
              setLinkedAppointment(app);
              // Also update status to em_atendimento if new
              if (app.status !== 'em_atendimento' && app.status !== 'realizado') {
                  base44.entities.Agendamento.update(app.id, { status: "em_atendimento" });
              }
          }
      } catch (e) {
          console.error("Error loading appointment", e);
      }
  };

  const loadExistingAnamnesis = async (id) => {
    const data = await base44.entities.Anamnesis.list();
    const foundAnamnesis = data.find(a => a.id === id);
    
    if (foundAnamnesis) {
      setAnamnesis(foundAnamnesis);
      setCurrentAnamnesisId(id);
      setSelectedPatient({ id: foundAnamnesis.patient_id, nome: foundAnamnesis.patient_name });
      setDataConsulta(foundAnamnesis.data_consulta);
      setHorarioConsulta(foundAnamnesis.horario_consulta || "");
      setTextoOriginal(foundAnamnesis.texto_original || "");
      
      if (foundAnamnesis.subjetivo || foundAnamnesis.objetivo || foundAnamnesis.avaliacao || foundAnamnesis.plano) {
        setSoapData({
          subjetivo: foundAnamnesis.subjetivo || "",
          objetivo: foundAnamnesis.objetivo || "",
          avaliacao: foundAnamnesis.avaliacao || "",
          plano: foundAnamnesis.plano || ""
        });
      }

      if (foundAnamnesis.appointment_id) {
          try {
             const apps = await base44.entities.Agendamento.list();
             const appointment = apps.find(a => a.id === foundAnamnesis.appointment_id);
             if (appointment) setLinkedAppointment(appointment);
          } catch(e) { console.error(e); }
      } else {
          // Try to find by patient/date
          try {
            const agendamentos = await base44.entities.Agendamento.list();
            const match = agendamentos.find(ag => 
                ag.patient_id === foundAnamnesis.patient_id && 
                ag.data_agendamento === foundAnamnesis.data_consulta
            );
            if (match) setLinkedAppointment(match);
          } catch(e) { console.error(e); }
      }
    }
  };

  const [activeDocType, setActiveDocType] = useState(null);

  const handleDocumentOpen = (docType) => {
    setActiveDocType(docType);
    setActiveDocument(docType);
  };

  return (
    <>
      <ToolsSidebar onToolOpen={setActiveTool} isDocumentsOpen={!!activeDocument} />
      <DocumentsSidebar onDocumentOpen={handleDocumentOpen} isToolsOpen={!!activeTool} />
      
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
        {activeDocument === 'receita' && (
          <FloatingDocument
            document={{ name: "Receita" }}
            onClose={() => { setActiveDocument(null); setActiveDocType(null); }}
          >
            <ReceitaFormAdvanced />
          </FloatingDocument>
        )}
        {activeDocument === 'atestado' && (
          <FloatingDocument
            document={{ name: "Atestado" }}
            onClose={() => { setActiveDocument(null); setActiveDocType(null); }}
          >
            <DocumentForm
              tipo="atestado"
              tipoLabel="Atestado Médico"
              icon={ClipboardList}
              templateEntity={AtestadoTemplate}
            />
          </FloatingDocument>
        )}
        {activeDocument === 'exame' && (
          <FloatingDocument
            document={{ name: "Exame" }}
            onClose={() => { setActiveDocument(null); setActiveDocType(null); }}
          >
            <DocumentForm
              tipo="exame"
              tipoLabel="Solicitação de Exames"
              icon={FileCheck}
              templateEntity={ExameTemplate}
            />
          </FloatingDocument>
        )}
        {activeDocument === 'encaminhamento' && (
          <FloatingDocument
            document={{ name: "Encaminhamento" }}
            onClose={() => { setActiveDocument(null); setActiveDocType(null); }}
          >
            <DocumentForm
              tipo="encaminhamento"
              tipoLabel="Encaminhamento Médico"
              icon={Send}
              templateEntity={EncaminhamentoTemplate}
            />
          </FloatingDocument>
        )}
        {activeDocument === 'orientacao' && (
          <FloatingDocument
            document={{ name: "Orientação" }}
            onClose={() => { setActiveDocument(null); setActiveDocType(null); }}
          >
            <DocumentForm
              tipo="orientacoes"
              tipoLabel="Orientação"
              icon={Info}
              templateEntity={base44.entities.OrientacoesTemplate}
            />
          </FloatingDocument>
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
            title="Voltar ao Início"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Atendimento</h1>
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

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="horario" className="text-sm">Horário</Label>
                  <Input
                    id="horario"
                    type="time"
                    value={horarioConsulta}
                    onChange={(e) => setHorarioConsulta(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
              </div>

              {linkedAppointment && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100 grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs text-gray-500 block">Horário Agendado</span>
                        <span className="text-sm font-medium text-blue-900">{linkedAppointment.horario_inicio}</span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 block">Horário Recepcionado</span>
                        <span className="text-sm font-medium text-blue-900">{linkedAppointment.horario_recepcao || "-"}</span>
                    </div>
                </div>
              )}

              {templates.length > 0 && (
                <div>
                  <Label htmlFor="template" className="text-sm">Usar Modelo ao Carregar (Opcional)</Label>
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
                          {template.is_medisoap_public && " 🌐"}
                          {template.is_public_org && !template.is_medisoap_public && " 👥"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mostrar dados da triagem se existirem */}
          {(soapData || textoOriginal) && (anamnesis?.triagem_pa || anamnesis?.triagem_temperatura || anamnesis?.triagem_peso || anamnesis?.triagem_altura || anamnesis?.triagem_queixa) && (
            <Card className="shadow-lg border-none bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Dados da Triagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {anamnesis?.triagem_pa && (
                    <div className="bg-white p-3 rounded-lg">
                      <span className="text-gray-600 font-medium">PA:</span>
                      <span className="ml-2 text-gray-900">{anamnesis.triagem_pa}</span>
                    </div>
                  )}
                  {anamnesis?.triagem_temperatura && (
                    <div className="bg-white p-3 rounded-lg">
                      <span className="text-gray-600 font-medium">Temp:</span>
                      <span className="ml-2 text-gray-900">{anamnesis.triagem_temperatura}</span>
                    </div>
                  )}
                  {anamnesis?.triagem_peso && (
                    <div className="bg-white p-3 rounded-lg">
                      <span className="text-gray-600 font-medium">Peso:</span>
                      <span className="ml-2 text-gray-900">{anamnesis.triagem_peso}</span>
                    </div>
                  )}
                  {anamnesis?.triagem_altura && (
                    <div className="bg-white p-3 rounded-lg">
                      <span className="text-gray-600 font-medium">Altura:</span>
                      <span className="ml-2 text-gray-900">{anamnesis.triagem_altura}</span>
                    </div>
                  )}
                </div>
                {anamnesis?.triagem_queixa && (
                  <div className="mt-3 bg-white p-3 rounded-lg">
                    <span className="text-gray-600 font-medium block mb-1">Queixa:</span>
                    <p className="text-gray-900">{anamnesis.triagem_queixa}</p>
                  </div>
                )}
                {anamnesis?.triagem_observacoes && (
                  <div className="mt-3 bg-white p-3 rounded-lg">
                    <span className="text-gray-600 font-medium block mb-1">Observações:</span>
                    <p className="text-gray-900">{anamnesis.triagem_observacoes}</p>
                  </div>
                )}
                <div className="mt-3 text-xs text-gray-600">
                  Triagem realizada por: {anamnesis?.triagem_realizada_por || "Não informado"}
                  {anamnesis?.triagem_data_hora && ` em ${new Date(anamnesis.triagem_data_hora).toLocaleString('pt-BR')}`}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-base">Atendimento</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                placeholder="Digite ou cole aqui o texto da conversa com o paciente..."
                value={textoOriginal}
                onChange={setTextoOriginal}
                minHeight="200px"
              />
              <div className="mt-4">
                {/* Lista de CIDs adicionados */}
                {cidText && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold text-blue-900">CIDs Incluídos:</Label>
                      <button
                        onClick={() => setCidText("")}
                        className="text-xs text-red-600 hover:text-red-800 hover:underline"
                      >
                        Limpar todos
                      </button>
                    </div>
                    <div className="space-y-1">
                      {cidText.split('\n').map((line, idx) => (
                        <div key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-600 font-mono font-semibold">•</span>
                          <span className="flex-1">{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => setShowCidDialog(true)}
                    variant="outline"
                    className="flex-1 min-w-[140px] text-sm h-9"
                  >
                    Incluir CID
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
                        <SelectValue placeholder="Modelo para IA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem modelo</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.nome}
                            {template.is_medisoap_public && " 🌐"}
                            {template.is_public_org && !template.is_medisoap_public && " 👥"}
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
                  <RichTextEditor
                    value={soapTextContent}
                    onChange={setSoapTextContent}
                    minHeight="300px"
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

      <Dialog open={showCidDialog} onOpenChange={(open) => {
        setShowCidDialog(open);
        if (!open) {
          setCidSearchTerm("");
          setSelectedCids([]);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Incluir CID</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cid" className="text-sm">Buscar CID</Label>
              <div className="mt-2">
                <Input
                  placeholder="Buscar por código ou descrição..."
                  value={cidSearchTerm}
                  onChange={(e) => setCidSearchTerm(e.target.value)}
                  autoFocus
                  className="text-sm"
                />
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              {cids
                .filter(
                  (cid) =>
                    (cid.codigo.toLowerCase().includes(cidSearchTerm.toLowerCase()) ||
                    cid.descricao.toLowerCase().includes(cidSearchTerm.toLowerCase())) &&
                    !selectedCids.find(s => s.id === cid.id)
                )
                .map((cid) => (
                  <button
                    key={cid.id}
                    onClick={() => {
                      if (selectedCids.length < 10) {
                        setSelectedCids([...selectedCids, cid]);
                        setCidSearchTerm("");
                      }
                    }}
                    disabled={selectedCids.length >= 10}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600 min-w-[60px]">
                        {cid.codigo}
                      </span>
                      <span className="text-sm flex-1">{cid.descricao}</span>
                      {cid.uso_frequente && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </button>
                ))}
              {cids.filter(
                (cid) =>
                  (cid.codigo.toLowerCase().includes(cidSearchTerm.toLowerCase()) ||
                  cid.descricao.toLowerCase().includes(cidSearchTerm.toLowerCase())) &&
                  !selectedCids.find(s => s.id === cid.id)
              ).length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {selectedCids.length >= 10 ? "Limite máximo de 10 CIDs atingido" : "Nenhum CID encontrado"}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { 
              setShowCidDialog(false); 
              setCidSearchTerm(""); 
              setSelectedCids([]);
            }} className="text-sm h-9">
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                const cidsText = selectedCids.map(c => `${c.codigo} - ${c.descricao}`).join('\n');
                setCidText(cidText ? `${cidText}\n${cidsText}` : cidsText);
                setShowCidDialog(false);
                setCidSearchTerm("");
                setSelectedCids([]);
              }}
              disabled={selectedCids.length === 0}
              className="text-sm h-9"
            >
              Incluir ({selectedCids.length})
            </Button>
          </div>
          {selectedCids.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-sm mb-3 block font-semibold">CIDs Selecionados ({selectedCids.length}/10)</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {selectedCids.map((cid) => (
                  <div key={cid.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-mono font-bold text-blue-700 text-sm">
                        {cid.codigo}
                      </span>
                      <span className="text-sm text-gray-700">
                        {cid.descricao}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedCids(selectedCids.filter(c => c.id !== cid.id))}
                      className="ml-2 hover:bg-red-100 text-red-600 rounded-full p-1.5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}