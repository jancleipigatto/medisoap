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
import PatientFormDialog from "@/components/patients/PatientFormDialog";
import TemplatePickerDialog from "./TemplatePickerDialog";
import CID11Dialog from "./CID11Dialog";
import ToolsSidebar from "../tools/ToolsSidebar";
import DocumentsSidebar from "../medical/DocumentsSidebar";
import GestationalAgeCalculator from "../tools/GestationalAgeCalculator";
import BMICalculator from "../tools/BMICalculator";
import AlvaradoScore from "../tools/AlvaradoScore";
import CardiacRiskCalculator from "../tools/CardiacRiskCalculator";
import GFRCalculator from "../tools/GFRCalculator";
import SimpleCalculator from "../tools/SimpleCalculator";
import FloatingDocument from "../medical/FloatingDocument";
import DocumentForm from "../medical/DocumentForm";
import ReceitaFormAdvanced from "../medical/ReceitaFormAdvanced";
import { AnimatePresence } from "framer-motion";
import { Star, X, Activity, ClipboardList, FileCheck, Send, Info, Pill, User, Lock, Unlock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AtestadoTemplate } from "@/entities/AtestadoTemplate";
import { ExameTemplate } from "@/entities/ExameTemplate";
import { EncaminhamentoTemplate } from "@/entities/EncaminhamentoTemplate";

export default function NewAnamnesisContent() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isInfoLocked, setIsInfoLocked] = useState(false);
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
  const [showCid10Dialog, setShowCid10Dialog] = useState(false);
  const [showCid11Dialog, setShowCid11Dialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplateObj, setSelectedTemplateObj] = useState(null);
  const [cidText, setCidText] = useState("");
  const [appSettings, setAppSettings] = useState(null);
  const [cids, setCids] = useState([]);
  const [cidSearchTerm, setCidSearchTerm] = useState("");
  const [selectedCids, setSelectedCids] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [anamnesis, setAnamnesis] = useState(null);
  const [linkedAppointment, setLinkedAppointment] = useState(null);
  
  // Sidebar states
  const [toolsSidebarOpen, setToolsSidebarOpen] = useState(false);
  const [docsSidebarOpen, setDocsSidebarOpen] = useState(false);
  const [toolsSidebarWidth, setToolsSidebarWidth] = useState(120);
  const [docsSidebarWidth, setDocsSidebarWidth] = useState(120);
  const [showTriagem, setShowTriagem] = useState(true);
  const [previousStatus, setPreviousStatus] = useState(null);
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [isConfidential, setIsConfidential] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [triageData, setTriageData] = useState({
    pa: "",
    temp: "",
    peso: "",
    altura: "",
    spo2: "",
    fc: "",
    fr: "",
    hgt: "",
    queixa: ""
  });
  const [showManualTriage, setShowManualTriage] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(console.error);
  }, []);

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

  const convertToSOAP = async () => {
    if (!textoOriginal.trim()) {
      alert("Por favor, digite o texto do atendimento");
      return;
    }

    setIsProcessing(true);

    try {
      // --- SE HÁ MODELO SELECIONADO: reescrever com correções para o modelo ---
      if (selectedTemplateObj) {
        const prompt = `Você é um assistente médico especializado em prontuário eletrônico.
Sua tarefa é reescrever o texto do atendimento abaixo fazendo APENAS as seguintes correções:
- Corrigir erros ortográficos e gramaticais
- Melhorar organização e clareza
- Corrigir concordância e sintaxe
- Adaptar o texto para seguir a estrutura e estilo do MODELO DE REFERÊNCIA abaixo

IMPORTANTE: Mantenha TODAS as informações clínicas do texto original. Não invente ou omita dados clínicos.

MODELO DE REFERÊNCIA (estrutura e estilo a seguir):
${selectedTemplateObj.template_texto}

TEXTO ORIGINAL DO ATENDIMENTO:
${textoOriginal}

Responda APENAS com o texto reescrito, sem explicações ou comentários.`;

        const result = await base44.integrations.Core.InvokeLLM({ prompt });

        // Converter resultado para HTML com parágrafos
        const toHtml = (text) => text
          .split(/\n+/)
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .map(l => `<p>${l}</p>`)
          .join("");

        setSoapData({ subjetivo: result, objetivo: "", avaliacao: "", plano: "" });
        setSoapTextContent(toHtml(result));
        setIsProcessing(false);
        return;
      }

      // --- SEM MODELO: fluxo SOAP padrão ---
      // Montar dados de triagem disponíveis (da anamnese salva ou manual)
      const tData = {
        pa: anamnesis?.triagem_pa || triageData.pa || "",
        temp: anamnesis?.triagem_temperatura || triageData.temp || "",
        peso: anamnesis?.triagem_peso || triageData.peso || "",
        altura: anamnesis?.triagem_altura || triageData.altura || "",
        spo2: anamnesis?.triagem_spo2 || triageData.spo2 || "",
        fc: anamnesis?.triagem_fc || triageData.fc || "",
        fr: anamnesis?.triagem_fr || triageData.fr || "",
        hgt: anamnesis?.triagem_hgt || triageData.hgt || "",
        queixa: anamnesis?.triagem_queixa || triageData.queixa || "",
      };
      const triagemLines = [];
      if (tData.pa) triagemLines.push(`PA: ${tData.pa} mmHg`);
      if (tData.fc) triagemLines.push(`FC: ${tData.fc} bpm`);
      if (tData.fr) triagemLines.push(`FR: ${tData.fr} irpm`);
      if (tData.temp) triagemLines.push(`Temperatura: ${tData.temp}°C`);
      if (tData.spo2) triagemLines.push(`SpO2: ${tData.spo2}%`);
      if (tData.peso) triagemLines.push(`Peso: ${tData.peso} kg`);
      if (tData.altura) triagemLines.push(`Altura: ${tData.altura} cm`);
      if (tData.hgt) triagemLines.push(`HGT: ${tData.hgt} mg/dL`);
      const triagemTexto = triagemLines.length > 0 ? `\n\nDADOS DE TRIAGEM (use estes no O - Objetivo):\n${triagemLines.join('\n')}` : "";

      // Dados do paciente para contexto
      const pacienteInfo = selectedPatient ? `\n\nDADOS DO PACIENTE:\nNome: ${selectedPatient.nome}${selectedPatient.data_nascimento ? `\nNascimento: ${selectedPatient.data_nascimento}` : ''}${selectedPatient.comorbidades ? `\nComorbidades: ${selectedPatient.comorbidades}` : ''}${selectedPatient.medicamentos_uso_continuo ? `\nMedicamentos contínuos: ${selectedPatient.medicamentos_uso_continuo}` : ''}` : "";

      // Prompt customizado do usuário ou padrão detalhado
      const customPrompt = appSettings?.prompt_prontuario;

      const systemPrompt = customPrompt || `Você é um médico assistente especializado em prontuário eletrônico no formato SOAP.`;

      const instrucoes = `
INSTRUÇÕES PARA GERAÇÃO DO PRONTUÁRIO SOAP:

1. CABEÇALHO obrigatório com informações relevantes do paciente (use apenas as disponíveis):
   - Comorbidades (ex: "# Comorbidades: HAS, DM2" ou "# Comorbidades: Nega")
   - MUC - Medicamentos de Uso Contínuo (ex: "# MUC: Losartana 50mg 1x/dia" ou "# MUC: Nega")
   - Alergias medicamentosas (ex: "# Alergias: Nega atopias medicamentosas")
   - Cirurgias prévias (ex: "# Cirurgias prévias: Appendicectomia 2010" ou "# Cirurgias prévias: Nega")
   - Histórico familiar relevante (ex: "# HF: Nega histórico familiar relevante")
   - Uso de antibiótico nos últimos 3 meses (ex: "# ATB < 3 meses: Nega")
   Inclua APENAS informações que foram mencionadas no texto. Se algo for negado, escreva "Nega".

2. S - SUBJETIVO: Descrição detalhada da queixa principal, história da doença atual (HDA) com cronologia, qualidade, intensidade, fatores de melhora/piora, sintomas associados. Seja completo e narrativo.

3. O - OBJETIVO: Use os dados de triagem disponíveis (PA, FC, FR, Temperatura, SpO2, Peso, Altura, HGT). Descreva exame físico de forma objetiva e concisa. Ex: "BEG, LOTE, PA: 120/80mmHg, FC: 80bpm, SpO2: 98%..."

4. A - AVALIAÇÃO: Diagnóstico(s) de forma objetiva e direta. Liste as hipóteses diagnósticas. Seja conciso.

5. P - PLANO: Conduta terapêutica de forma objetiva. Liste medicamentos, exames, orientações, retorno. Seja direto e conciso.

Retorne JSON com: cabecalho, subjetivo, objetivo, avaliacao, plano.`;

      const userContent = `TEXTO DO ATENDIMENTO:\n${textoOriginal}${triagemTexto}${pacienteInfo}`;
      const fullPrompt = `${systemPrompt}\n\n${instrucoes}\n\n${userContent}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            cabecalho: { type: "string" },
            subjetivo: { type: "string" },
            objetivo: { type: "string" },
            avaliacao: { type: "string" },
            plano: { type: "string" }
          }
        }
      });

      setSoapData(result);

      // Helper: converte texto plano em HTML com parágrafos
      const toHtmlParagraphs = (text) => {
        if (!text) return "";
        return text
          .split(/\n+/)
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => `<p>${line}</p>`)
          .join("");
      };

      // Processar cabeçalho: cada item # em parágrafo separado
      let cabecalhoHtml = "";
      if (result.cabecalho) {
        const itens = result.cabecalho
          .split(/#/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        cabecalhoHtml = itens.map(item => `<p><strong># ${item}</strong></p>`).join("") + "<p><br></p>";
      }

      const formattedHtml = 
        cabecalhoHtml +
        `<p><strong>S - SUBJETIVO:</strong></p>${toHtmlParagraphs(result.subjetivo)}` +
        `<p><br></p><p><strong>O - OBJETIVO:</strong></p>${toHtmlParagraphs(result.objetivo)}` +
        `<p><br></p><p><strong>A - AVALIAÇÃO:</strong></p>${toHtmlParagraphs(result.avaliacao)}` +
        `<p><br></p><p><strong>P - PLANO:</strong></p>${toHtmlParagraphs(result.plano)}`;

      setSoapTextContent(formattedHtml);

    } catch (error) {
      console.error("Erro na conversão:", error);
      alert("Ocorreu um erro ao processar o texto. Tente simplificar ou reduzir o tamanho do texto.");
    } finally {
      setIsProcessing(false);
    }
  };

  const applyTemplateToText = async () => {
    if (!textoOriginal.trim()) {
      alert("Por favor, digite algum texto para converter");
      return;
    }
    
    if (!selectedTemplate || selectedTemplate === "none") {
      alert("Selecione um modelo para usar como referência");
      return;
    }
    
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    if (!window.confirm("Isso irá reescrever seu texto atual seguindo o modelo selecionado. Deseja continuar?")) return;

    setIsProcessing(true);

    try {
      const prompt = `
        Você é um assistente médico. 
        Sua tarefa é reescrever o texto do atendimento médico fornecido abaixo para que ele siga a ESTRUTURA e ESTILO do Modelo de Referência.
        Mantenha todas as informações clínicas importantes do texto original, apenas reorganize e reformate para seguir o modelo.
        
        MODELO DE REFERÊNCIA:
        ${template.template_texto}
        
        TEXTO ORIGINAL DO ATENDIMENTO:
        ${textoOriginal}
        
        Responda APENAS com o novo texto reescrito. Não inclua explicações.
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      setTextoOriginal(result); // Atualiza o texto principal com a versão convertida

    } catch (error) {
      console.error("Erro na conversão de modelo:", error);
      alert("Erro ao aplicar modelo.");
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

  const saveAnamnesisWithoutSOAP = async (silent = false) => {
    if (!selectedPatient) {
      if (!silent) alert("Por favor, selecione um paciente");
      return;
    }

    if (!textoOriginal.trim() && !triageData.queixa && !triageData.pa) {
      if (!silent) alert("Por favor, digite o texto do atendimento ou dados de triagem");
      return;
    }

    // Don't set saving state for silent auto-saves to avoid UI flicker/locking
    if (!silent) setIsSaving(true);

    const commonData = {
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.nome,
      data_consulta: dataConsulta,
      horario_consulta: horarioConsulta,
      texto_original: textoOriginal,
      // Include manual triage data
      triagem_pa: triageData.pa,
      triagem_temperatura: triageData.temp,
      triagem_peso: triageData.peso,
      triagem_altura: triageData.altura,
      triagem_spo2: triageData.spo2,
      triagem_fc: triageData.fc,
      triagem_fr: triageData.fr,
      triagem_hgt: triageData.hgt,
      triagem_queixa: triageData.queixa,
      // If manual triage is used, mark user as triage performer if not set? 
      // Maybe not overwrite if existing?
      // For now simple update.
    };

    if (currentAnamnesisId) {
      await base44.entities.Anamnesis.update(currentAnamnesisId, commonData);
    } else {
      const numeroAtendimento = await generateAttendanceNumber(dataConsulta);
      const created = await base44.entities.Anamnesis.create({
        ...commonData,
        numero_atendimento: numeroAtendimento,
        subjetivo: "",
        objetivo: "",
        avaliacao: "",
        plano: ""
      });
      setCurrentAnamnesisId(created.id);
    }

    if (!silent) {
      setIsSaving(false);
      alert("Atendimento salvo com sucesso!");
    }
  };

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedPatient && (textoOriginal || triageData.pa || triageData.queixa)) {
        saveAnamnesisWithoutSOAP(true);
      }
    }, 5000); // 5 seconds debounce
    return () => clearTimeout(timer);
  }, [selectedPatient, textoOriginal, triageData, dataConsulta, horarioConsulta, currentAnamnesisId]);

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

    // Texto original atualizado (sobrescreve para evitar duplicação)
    let finalTextoOriginal = textoOriginal;

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
      plano: finalSoapData?.plano || "",
      is_confidential: isConfidential,
      creator_id: currentUser?.id,
      // Include Manual Triage Data
      triagem_pa: triageData.pa,
      triagem_temperatura: triageData.temp,
      triagem_peso: triageData.peso,
      triagem_altura: triageData.altura,
      triagem_spo2: triageData.spo2,
      triagem_fc: triageData.fc,
      triagem_fr: triageData.fr,
      triagem_hgt: triageData.hgt,
      triagem_queixa: triageData.queixa
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

    // Atualizar status do agendamento vinculado, se houver
    if (linkedAppointment && linkedAppointment.status !== 'realizado') {
        try {
            await base44.entities.Agendamento.update(linkedAppointment.id, { 
                status: 'realizado' // ou 'atendimento_realizado' dependendo da enum
            });
        } catch (error) {
            console.error("Erro ao atualizar status do agendamento:", error);
        }
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
    
    // Check for patient_id passed (e.g. from Triage/Agenda)
    const patientId = urlParams.get('patient_id');
    if (patientId) {
      loadPatientData(patientId);
    }
  }, []);

  const loadPatientData = async (id) => {
    try {
      const patient = await base44.entities.Patient.get(id);
      if (patient) {
        setSelectedPatient(patient);
        setIsInfoLocked(true);
      }
    } catch (e) {
      console.error("Error loading patient", e);
    }
  };

  const loadAppointmentData = async (id) => {
      try {
          const apps = await base44.entities.Agendamento.list();
          const app = apps.find(a => a.id === id);
          if (app) {
              setLinkedAppointment(app);
              setIsInfoLocked(true); // Lock info if coming from appointment
              // Also update status to em_atendimento if new
              if (app.status !== 'em_atendimento' && app.status !== 'realizado') {
                  setPreviousStatus(app.status); // Save previous status
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
      setIsInfoLocked(true); // Lock info on existing anamnesis
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
      <ToolsSidebar 
        onToolOpen={setActiveTool} 
        isOpen={toolsSidebarOpen}
        setIsOpen={setToolsSidebarOpen}
        width={toolsSidebarWidth}
        setWidth={setToolsSidebarWidth}
        otherSidebarOpen={docsSidebarOpen}
        otherSidebarWidth={docsSidebarWidth}
      />
      <DocumentsSidebar 
        onDocumentOpen={handleDocumentOpen} 
        isOpen={docsSidebarOpen}
        setIsOpen={setDocsSidebarOpen}
        width={docsSidebarWidth}
        setWidth={setDocsSidebarWidth}
        otherSidebarOpen={toolsSidebarOpen}
        otherSidebarWidth={toolsSidebarWidth}
      />
      
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
        {activeTool === 'alvarado' && (
          <AlvaradoScore 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
        {activeTool === 'cardiac_risk' && (
          <CardiacRiskCalculator 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
        {activeTool === 'gfr' && (
          <GFRCalculator 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
        {activeTool === 'calculator' && (
          <SimpleCalculator 
            onClose={() => setActiveTool(null)}
            onSave={handleToolSave}
          />
        )}
        {activeDocument === 'receita' && (
          <FloatingDocument
            document={{ name: "Receita" }}
            onClose={() => { setActiveDocument(null); setActiveDocType(null); }}
          >
            <ReceitaFormAdvanced 
              patient={selectedPatient} 
              dataConsulta={dataConsulta}
              horarioConsulta={horarioConsulta}
              onSuccess={() => { /* Optionally close or keep open */ }}
            />
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
              patient={selectedPatient}
              dataConsulta={dataConsulta}
              horarioConsulta={horarioConsulta}
              onSuccess={() => { /* Optionally close or keep open */ }}
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
              patient={selectedPatient}
              dataConsulta={dataConsulta}
              horarioConsulta={horarioConsulta}
              onSuccess={() => { /* Optionally close or keep open */ }}
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
              patient={selectedPatient}
              dataConsulta={dataConsulta}
              horarioConsulta={horarioConsulta}
              onSuccess={() => { /* Optionally close or keep open */ }}
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
              patient={selectedPatient}
              dataConsulta={dataConsulta}
              horarioConsulta={horarioConsulta}
              onSuccess={() => { /* Optionally close or keep open */ }}
            />
          </FloatingDocument>
        )}
      </AnimatePresence>

      <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen pr-36">
        <div className="w-full max-w-[95%] mx-auto">
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
            <CardContent className="pt-6 space-y-4">
              {isInfoLocked ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        {selectedPatient?.foto_url ? (
                            <img src={selectedPatient.foto_url} alt={selectedPatient.nome} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm">
                                <User className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <Label className="text-xs text-gray-500 uppercase font-bold tracking-wide">Paciente</Label>
                            <p className="text-lg font-medium text-gray-900">{selectedPatient?.nome}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(createPageUrl(`PatientHistory?patientId=${selectedPatient.id}`), '_blank')}>
                      Histórico
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-xs text-gray-500 uppercase font-bold tracking-wide">Data</Label>
                      <p className="text-sm font-medium text-gray-900">{new Date(dataConsulta).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 uppercase font-bold tracking-wide">Horário</Label>
                      <p className="text-sm font-medium text-gray-900">{horarioConsulta}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <PatientSelector
                    selectedPatient={selectedPatient}
                    onSelect={setSelectedPatient}
                  />

                  {selectedPatient && (
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        className="text-sm h-9"
                        onClick={() => window.open(createPageUrl(`Patients?edit=${selectedPatient.id}`), '_blank')}
                      >
                        Editar Paciente
                      </Button>
                      <Button
                        variant="outline"
                        className="text-sm h-9"
                        onClick={() => setShowPatientDialog(true)}
                      >
                        Novo Paciente
                      </Button>
                      <Button
                        variant="outline"
                        className="text-sm h-9"
                        onClick={() => window.open(createPageUrl(`PatientHistory?patientId=${selectedPatient.id}`), '_blank')}
                      >
                        Histórico
                      </Button>
                    </div>
                  )}

                  {!selectedPatient && (
                    <Button
                      variant="outline"
                      onClick={() => setShowPatientDialog(true)}
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

                  {selectedPatient && (
                    <Button 
                      onClick={() => setIsInfoLocked(true)} 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Salvar Informações & Iniciar Atendimento
                    </Button>
                  )}
                </>
              )}

              {/* Manual Triage Section */}
              <div className="border-t pt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowManualTriage(!showManualTriage)}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 w-full justify-start p-0 h-auto"
                >
                  <Activity className="w-4 h-4" />
                  <span className="font-medium">Inserir Dados de Triagem Manualmente</span>
                  <span className="text-xs text-gray-400 ml-auto">{showManualTriage ? "Ocultar" : "Mostrar"}</span>
                </Button>
                
                {showManualTriage && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 bg-gray-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <div>
                      <Label className="text-xs">PA (mmHg)</Label>
                      <Input 
                        value={triageData.pa} 
                        onChange={(e) => setTriageData({...triageData, pa: e.target.value})}
                        className="h-8 text-sm bg-white" placeholder="120/80" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Temp (°C)</Label>
                      <Input 
                        value={triageData.temp} 
                        onChange={(e) => setTriageData({...triageData, temp: e.target.value})}
                        className="h-8 text-sm bg-white" placeholder="36.5" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Peso (kg)</Label>
                      <Input 
                        value={triageData.peso} 
                        onChange={(e) => setTriageData({...triageData, peso: e.target.value})}
                        className="h-8 text-sm bg-white" placeholder="70" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Altura (cm)</Label>
                      <Input 
                        value={triageData.altura} 
                        onChange={(e) => setTriageData({...triageData, altura: e.target.value})}
                        className="h-8 text-sm bg-white" placeholder="170" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">SpO2 (%)</Label>
                      <Input 
                        value={triageData.spo2} 
                        onChange={(e) => setTriageData({...triageData, spo2: e.target.value})}
                        className="h-8 text-sm bg-white" placeholder="98" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">FC (bpm)</Label>
                      <Input 
                        value={triageData.fc} 
                        onChange={(e) => setTriageData({...triageData, fc: e.target.value})}
                        className="h-8 text-sm bg-white" placeholder="80" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">HGT (mg/dL)</Label>
                      <Input 
                        value={triageData.hgt} 
                        onChange={(e) => setTriageData({...triageData, hgt: e.target.value})}
                        className="h-8 text-sm bg-white" placeholder="90" 
                      />
                    </div>
                    <div className="col-span-2 md:col-span-4">
                      <Label className="text-xs">Queixa Principal</Label>
                      <Input 
                        value={triageData.queixa} 
                        onChange={(e) => setTriageData({...triageData, queixa: e.target.value})}
                        className="h-8 text-sm bg-white" placeholder="Dor de cabeça..." 
                      />
                    </div>
                  </div>
                )}
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
            </CardContent>
          </Card>

          {/* Mostrar dados da triagem se existirem */}
          {(soapData || textoOriginal || anamnesis) && (
            anamnesis?.triagem_pa || 
            anamnesis?.triagem_temperatura || 
            anamnesis?.triagem_peso || 
            anamnesis?.triagem_altura || 
            anamnesis?.triagem_spo2 || 
            anamnesis?.triagem_fc || 
            anamnesis?.triagem_fr || 
            anamnesis?.triagem_hgt ||
            anamnesis?.triagem_queixa
          ) && (
            <Card className="shadow-lg border-none bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Dados da Triagem
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowTriagem(!showTriagem)}
                    className="h-8 px-2 text-green-700 hover:text-green-800 hover:bg-green-100"
                  >
                    {showTriagem ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
              </CardHeader>
              {showTriagem && (
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                    {anamnesis?.triagem_pa && (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium block text-xs uppercase tracking-wide">PA</span>
                        <span className="text-gray-900 font-semibold">{anamnesis.triagem_pa}</span>
                      </div>
                    )}
                    {anamnesis?.triagem_temperatura && (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium block text-xs uppercase tracking-wide">Temp</span>
                        <span className="text-gray-900 font-semibold">{anamnesis.triagem_temperatura}</span>
                      </div>
                    )}
                    {anamnesis?.triagem_peso && (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium block text-xs uppercase tracking-wide">Peso</span>
                        <span className="text-gray-900 font-semibold">{anamnesis.triagem_peso}</span>
                      </div>
                    )}
                    {anamnesis?.triagem_altura && (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium block text-xs uppercase tracking-wide">Altura</span>
                        <span className="text-gray-900 font-semibold">{anamnesis.triagem_altura}</span>
                      </div>
                    )}
                    {anamnesis?.triagem_spo2 && (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium block text-xs uppercase tracking-wide">SpO2</span>
                        <span className="text-gray-900 font-semibold">{anamnesis.triagem_spo2}</span>
                      </div>
                    )}
                    {anamnesis?.triagem_fc && (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium block text-xs uppercase tracking-wide">FC (BPM)</span>
                        <span className="text-gray-900 font-semibold">{anamnesis.triagem_fc}</span>
                      </div>
                    )}
                    {anamnesis?.triagem_fr && (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium block text-xs uppercase tracking-wide">FR (IRPM)</span>
                        <span className="text-gray-900 font-semibold">{anamnesis.triagem_fr}</span>
                      </div>
                    )}
                    {anamnesis?.triagem_hgt && (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium block text-xs uppercase tracking-wide">HGT</span>
                        <span className="text-gray-900 font-semibold">
                          {anamnesis.triagem_hgt}
                          {anamnesis.triagem_hgt_tipo && (
                            <span className="text-xs font-normal text-gray-500 block">({anamnesis.triagem_hgt_tipo === 'jejum' ? 'Jejum' : 'Pós-prandial'})</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {anamnesis?.triagem_queixa && (
                    <div className="mt-3 bg-white p-3 rounded-lg shadow-sm">
                      <span className="text-gray-600 font-medium block text-xs uppercase tracking-wide mb-1">Queixa Principal</span>
                      <p className="text-gray-900">{anamnesis.triagem_queixa}</p>
                    </div>
                  )}
                  {anamnesis?.triagem_observacoes && (
                    <div className="mt-3 bg-white p-3 rounded-lg shadow-sm">
                      <span className="text-gray-600 font-medium block text-xs uppercase tracking-wide mb-1">Observações</span>
                      <p className="text-gray-900">{anamnesis.triagem_observacoes}</p>
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-600 flex justify-between items-center border-t border-green-200 pt-2">
                    <span>Realizada por: {anamnesis?.triagem_realizada_por || "Não informado"}</span>
                    {anamnesis?.triagem_data_hora && <span>{new Date(anamnesis.triagem_data_hora).toLocaleString('pt-BR')}</span>}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          <Card className="shadow-lg border-none">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Atendimento</CardTitle>
                {templates.length > 0 && (
                  <div className="w-[250px] flex items-center gap-2">
                    <Label htmlFor="template" className="text-sm font-medium text-gray-600 whitespace-nowrap">Usar modelo</Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={handleTemplateSelect}
                    >
                      <SelectTrigger id="template" className="text-sm h-8">
                        <SelectValue placeholder="Selecione..." />
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
              </div>
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
                    onClick={applyTemplateToText}
                    disabled={isProcessing || !textoOriginal.trim() || !selectedTemplate || selectedTemplate === "none"}
                    variant="outline"
                    className="flex-1 min-w-[140px] text-sm h-9"
                    title="Reescreve seu texto usando a estrutura do modelo selecionado"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Aplicar Modelo
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={convertToSOAP}
                    disabled={isProcessing || !textoOriginal.trim()}
                    variant="outline"
                    className="flex-1 min-w-[140px] text-sm h-9"
                    title="Gera o prontuário SOAP automaticamente"
                  >
                     <FileText className="w-4 h-4 mr-2" />
                     Gerar SOAP
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
                  <div className="flex items-center space-x-2 border p-2 rounded-md bg-white">
                    <Switch
                        id="confidential-mode"
                        checked={isConfidential}
                        onCheckedChange={setIsConfidential}
                    />
                    <Label htmlFor="confidential-mode" className="text-sm cursor-pointer flex items-center gap-1">
                        {isConfidential ? <Lock className="w-3 h-3 text-red-600" /> : <Unlock className="w-3 h-3 text-green-600" />}
                        Sigilo Médico
                    </Label>
                  </div>
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
                  <Button
                    onClick={async () => {
                        if (confirm("Deseja realmente cancelar este atendimento? O paciente voltará para a fila.")) {
                            if (linkedAppointment) {
                                try {
                                    let newStatus = 'aguardando_triagem';
                                    
                                    // Check if triagem data exists
                                    const hasTriagem = anamnesis && (
                                        anamnesis.triagem_pa || anamnesis.triagem_temperatura || 
                                        anamnesis.triagem_peso || anamnesis.triagem_altura || 
                                        anamnesis.triagem_spo2 || anamnesis.triagem_fc || 
                                        anamnesis.triagem_fr || anamnesis.triagem_hgt ||
                                        anamnesis.triagem_queixa
                                    );

                                    if (hasTriagem) {
                                        newStatus = 'aguardando_atendimento';
                                    } else {
                                        newStatus = 'aguardando_triagem';
                                    }
                                    
                                    if (previousStatus) {
                                         newStatus = previousStatus;
                                    }

                                    await base44.entities.Agendamento.update(linkedAppointment.id, { status: newStatus });
                                    navigate(createPageUrl("Consulta"));
                                } catch (error) {
                                    console.error("Erro ao cancelar atendimento:", error);
                                    alert("Erro ao reverter status do agendamento.");
                                }
                            } else {
                                navigate(createPageUrl("Home"));
                            }
                        }
                    }}
                    variant="destructive"
                    className="flex-1 min-w-[140px] text-sm h-9"
                  >
                    Cancelar Atendimento
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

      <PatientFormDialog
        open={showPatientDialog}
        onOpenChange={setShowPatientDialog}
        onSuccess={(newPatient) => {
            if (newPatient) {
                setSelectedPatient(newPatient);
            }
        }}
      />

      {/* Diálogo de escolha CID-10 ou CID-11 */}
      <Dialog open={showCidDialog} onOpenChange={(open) => {
        setShowCidDialog(open);
        if (!open) {
          setCidSearchTerm("");
          setSelectedCids([]);
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Incluir CID — Escolha a versão</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Button
              className="h-14 text-base bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setShowCidDialog(false);
                setShowCid10Dialog(true);
              }}
            >
              CID - 10
              <span className="ml-2 text-xs opacity-80">(base local cadastrada)</span>
            </Button>
            <Button
              className="h-14 text-base bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                setShowCidDialog(false);
                window.open(createPageUrl("CID11Search"), '_blank');
              }}
            >
              CID - 11
              <span className="ml-2 text-xs opacity-80">(busca na OMS)</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo CID-10 */}
      <Dialog open={showCid10Dialog} onOpenChange={(open) => {
        setShowCid10Dialog(open);
        if (!open) {
          setCidSearchTerm("");
          setSelectedCids([]);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Incluir CID-10</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cid" className="text-sm">Buscar CID-10</Label>
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
              setShowCid10Dialog(false); 
              setCidSearchTerm(""); 
              setSelectedCids([]);
            }} className="text-sm h-9">
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                const cidsText = selectedCids.map(c => `${c.codigo} - ${c.descricao}`).join('\n');
                setCidText(cidText ? `${cidText}\n${cidsText}` : cidsText);
                setShowCid10Dialog(false);
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