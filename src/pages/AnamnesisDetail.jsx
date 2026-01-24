import React, { useState, useEffect } from "react";
import { Anamnesis } from "@/entities/Anamnesis";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, ClipboardList, FileCheck, Send, Copy, Check, Printer, Trash2, Pill, Save, Edit2, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PrintableDocument from "../components/medical/PrintableDocument";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ToolsSidebar from "../components/tools/ToolsSidebar";
import GestationalAgeCalculator from "../components/tools/GestationalAgeCalculator";
import BMICalculator from "../components/tools/BMICalculator";
import { AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function AnamnesisDetail() {
  const navigate = useNavigate();
  const [anamnesis, setAnamnesis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    atestado: "",
    exames_solicitados: "",
    encaminhamento: "",
    receita: "",
    orientacoes: ""
  });
  const [savedDocs, setSavedDocs] = useState([]);
  const [copied, setCopied] = useState({
    soap: false,
    atestado: false,
    exames: false,
    encaminhamento: false,
    receita: false,
    orientacoes: false
  });
  const [atestadoTemplates, setAtestadoTemplates] = useState([]);
  const [exameTemplates, setExameTemplates] = useState([]);
  const [encaminhamentoTemplates, setEncaminhamentoTemplates] = useState([]);
  const [receitaTemplates, setReceitaTemplates] = useState([]);
  const [showPrintPreview, setShowPrintPreview] = useState(null); // { tipo: string, conteudo: string }
  const [selectedTemplateData, setSelectedTemplateData] = useState({
    cabecalho: "",
    rodape: "",
    logo_url: ""
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  useEffect(() => {
    const loadAnamnesis = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (!id) {
          navigate(createPageUrl("Home"));
          return;
        }

        const data = await Anamnesis.list();
        const found = data.find(a => a.id === id);
        
        if (!found) {
          navigate(createPageUrl("Home"));
          return;
        }

        setAnamnesis(found);
        setEditData({
          atestado: found.atestado || "",
          exames_solicitados: found.exames_solicitados || "",
          encaminhamento: found.encaminhamento || "",
          receita: found.receita || "",
          orientacoes: found.orientacoes || ""
        });
        
        // Carregar templates e documentos
        const [
          { AtestadoTemplate },
          { ExameTemplate },
          { EncaminhamentoTemplate },
          { ReceitaTemplate },
          { MedicalDocument }
        ] = await Promise.all([
          import("@/entities/AtestadoTemplate"),
          import("@/entities/ExameTemplate"),
          import("@/entities/EncaminhamentoTemplate"),
          import("@/entities/ReceitaTemplate"),
          import("@/entities/MedicalDocument")
        ]);
        
        const [atestados, exames, encaminhamentos, receitas, allDocs] = await Promise.all([
          AtestadoTemplate.list("-created_date"),
          ExameTemplate.list("-created_date"),
          EncaminhamentoTemplate.list("-created_date"),
          ReceitaTemplate.list("-created_date"),
          MedicalDocument.list("-created_date")
        ]);
        
        setAtestadoTemplates(atestados);
        setExameTemplates(exames);
        setEncaminhamentoTemplates(encaminhamentos);
        setReceitaTemplates(receitas);
        
        const myDocs = allDocs.filter(d => d.patient_name === found.patient_name && d.data_consulta === found.data_consulta);
        setSavedDocs(myDocs);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading anamnesis:", error);
        setIsLoading(false);
        alert("Erro ao carregar anamnese: " + error.message);
      }
    };

    loadAnamnesis();
  }, [navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    await Anamnesis.update(anamnesis.id, editData);
    setAnamnesis({...anamnesis, ...editData});
    setIsSaving(false);
  };

  const saveDocument = async (tipo, conteudo, horario = "") => {
    const { MedicalDocument } = await import("@/entities/MedicalDocument");
    
    const docData = {
      tipo,
      patient_name: anamnesis.patient_name,
      data_consulta: anamnesis.data_consulta,
      horario_consulta: horario,
      conteudo,
      cabecalho: selectedTemplateData.cabecalho,
      rodape: selectedTemplateData.rodape,
      logo_url: selectedTemplateData.logo_url
    };
    
    const created = await MedicalDocument.create(docData);
    setSavedDocs([...savedDocs, created]);
    alert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} salvo com sucesso!`);
  };

  const deleteDocument = async (docId) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;
    
    const { MedicalDocument } = await import("@/entities/MedicalDocument");
    await MedicalDocument.delete(docId);
    setSavedDocs(savedDocs.filter(d => d.id !== docId));
  };

  const editDocument = (doc) => {
    const field = doc.tipo === 'atestado' ? 'atestado' : 
                  doc.tipo === 'exame' ? 'exames_solicitados' :
                  doc.tipo === 'encaminhamento' ? 'encaminhamento' :
                  doc.tipo === 'orientacoes' ? 'orientacoes' : 'receita';
    setEditData({...editData, [field]: doc.conteudo});
    setSelectedTemplateData({
      cabecalho: doc.cabecalho || "",
      rodape: doc.rodape || "",
      logo_url: doc.logo_url || ""
    });
  };

  const handleDelete = async () => {
    if (!deletionReason.trim()) {
      alert("Por favor, informe o motivo da exclusão");
      return;
    }

    setIsDeleting(true);
    await Anamnesis.update(anamnesis.id, {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deletion_reason: deletionReason
    });
    setIsDeleting(false);
    navigate(createPageUrl("Home"));
  };

  const generateSOAPText = () => {
    if (!anamnesis) return "";
    
    return `ANAMNESE - FORMATO SOAP

S - SUBJETIVO:
${anamnesis.subjetivo || "Não informado"}

O - OBJETIVO:
${anamnesis.objetivo || "Não informado"}

A - AVALIAÇÃO:
${anamnesis.avaliacao || "Não informado"}

P - PLANO:
${anamnesis.plano || "Não informado"}`;
  };

  const copyText = async (text, field) => {
    await navigator.clipboard.writeText(text);
    setCopied({...copied, [field]: true});
    setTimeout(() => setCopied({...copied, [field]: false}), 2000);
  };

  const handlePrint = (tipo, conteudo) => {
    setShowPrintPreview({ tipo, conteudo });
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintAll = () => {
    // Criar um array com todos os documentos preenchidos (sem duplicar)
    const allDocuments = [];
    
    if (editData.atestado && editData.atestado.trim()) {
      allDocuments.push({ tipo: "Atestado Médico", conteudo: editData.atestado });
    }
    if (editData.exames_solicitados && editData.exames_solicitados.trim()) {
      allDocuments.push({ tipo: "Solicitação de Exames", conteudo: editData.exames_solicitados });
    }
    if (editData.encaminhamento && editData.encaminhamento.trim()) {
      allDocuments.push({ tipo: "Encaminhamento Médico", conteudo: editData.encaminhamento });
    }
    if (editData.receita && editData.receita.trim()) {
      allDocuments.push({ tipo: "Receita Médica", conteudo: editData.receita });
    }
    if (editData.orientacoes && editData.orientacoes.trim()) {
      allDocuments.push({ tipo: "Orientações", conteudo: editData.orientacoes });
    }
    
    if (allDocuments.length === 0) {
      alert("Nenhum documento para imprimir. Preencha ao menos um documento.");
      return;
    }
    
    setShowPrintPreview({ tipo: "Todos os Documentos", conteudo: allDocuments, isMultiple: true });
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleGeneratePDF = async () => {
    // Criar um array com todos os documentos preenchidos
    const allDocuments = [];
    
    if (editData.atestado && editData.atestado.trim()) {
      allDocuments.push({ tipo: "Atestado Médico", conteudo: editData.atestado });
    }
    if (editData.exames_solicitados && editData.exames_solicitados.trim()) {
      allDocuments.push({ tipo: "Solicitação de Exames", conteudo: editData.exames_solicitados });
    }
    if (editData.encaminhamento && editData.encaminhamento.trim()) {
      allDocuments.push({ tipo: "Encaminhamento Médico", conteudo: editData.encaminhamento });
    }
    if (editData.receita && editData.receita.trim()) {
      allDocuments.push({ tipo: "Receita Médica", conteudo: editData.receita });
    }
    if (editData.orientacoes && editData.orientacoes.trim()) {
      allDocuments.push({ tipo: "Orientações", conteudo: editData.orientacoes });
    }
    
    if (allDocuments.length === 0) {
      alert("Nenhum documento para gerar PDF. Preencha ao menos um documento.");
      return;
    }
    
    // Obter usuário atual
    let currentUser;
    try {
      currentUser = await base44.auth.me();
    } catch (error) {
      console.error("Erro ao obter usuário:", error);
      currentUser = { full_name: "Usuario" };
    }
    
    // Formatar nome do arquivo: Nome do paciente_data da consulta_nome do atendente
    const dataFormatada = format(new Date(anamnesis.data_consulta), "dd-MM-yyyy");
    const fileName = `${anamnesis.patient_name}_${dataFormatada}_${currentUser.full_name}.pdf`;
    
    // Mostrar preview temporário
    setShowPrintPreview({ tipo: "Todos os Documentos", conteudo: allDocuments, isMultiple: true });
    
    // Aguardar renderização
    setTimeout(async () => {
      const printArea = document.querySelector('.pdf-print-area');
      if (!printArea) return;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < allDocuments.length; i++) {
        const docElement = printArea.children[i];
        if (!docElement) continue;
        
        const canvas = await html2canvas(docElement, {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }
      
      pdf.save(fileName);
      setShowPrintPreview(null);
    }, 500);
  };

  const loadTemplateForPrint = (templates, templateId, field) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEditData({...editData, [field]: template.template_texto});
      setSelectedTemplateData({
        cabecalho: template.cabecalho || "",
        rodape: template.rodape || "",
        logo_url: template.logo_url || ""
      });
    }
  };

  const handleToolSave = (toolResult) => {
    // Adicionar resultado da ferramenta ao campo objetivo
    const currentObjectivo = anamnesis.objetivo || "";
    const updatedObjectivo = currentObjectivo + "\n\n" + toolResult;
    
    setEditData({...editData});
    setAnamnesis({...anamnesis, objetivo: updatedObjectivo});
    
    // Salvar automaticamente
    Anamnesis.update(anamnesis.id, { objetivo: updatedObjectivo });
    
    // Fechar ferramenta
    setActiveTool(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!anamnesis) return null;

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

      {showPrintPreview && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <div className="no-print p-4 flex justify-end gap-2 bg-gray-100">
            <Button onClick={() => setShowPrintPreview(null)} variant="outline">
              Fechar
            </Button>
            <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              {showPrintPreview.isMultiple ? "Imprimir" : "Imprimir / Salvar PDF"}
            </Button>
          </div>
          {showPrintPreview.isMultiple ? (
            <div className="p-8 pdf-print-area">
              {showPrintPreview.conteudo.map((doc, index) => (
                <div key={index} className={index > 0 ? "page-break-before" : ""}>
                  <PrintableDocument
                    tipo={doc.tipo}
                    paciente={anamnesis.patient_name}
                    dataConsulta={anamnesis.data_consulta}
                    conteudo={doc.conteudo}
                    cabecalho={selectedTemplateData.cabecalho}
                    rodape={selectedTemplateData.rodape}
                    logoUrl={selectedTemplateData.logo_url}
                  />
                </div>
              ))}
            </div>
          ) : (
            <PrintableDocument
              tipo={showPrintPreview.tipo}
              paciente={anamnesis.patient_name}
              dataConsulta={anamnesis.data_consulta}
              conteudo={showPrintPreview.conteudo}
              cabecalho={selectedTemplateData.cabecalho}
              rodape={selectedTemplateData.rodape}
              logoUrl={selectedTemplateData.logo_url}
            />
          )}
        </div>
      )}

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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{anamnesis.patient_name}</h1>
              <div className="flex items-center gap-2 mt-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                {format(new Date(anamnesis.data_consulta), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700 border-green-200">
                SOAP
              </Badge>
              <Button
                onClick={handlePrintAll}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir Todos
              </Button>
              <Button
                onClick={handleGeneratePDF}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Gerar PDF
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue={(() => {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('tab') || 'anamnese';
          })()} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
              <TabsTrigger value="documentos">Documentos Médicos</TabsTrigger>
            </TabsList>

            <TabsContent value="anamnese" className="space-y-6">
              {anamnesis.texto_original && (
                <Card className="shadow-lg border-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-700">
                      <FileText className="w-5 h-5" />
                      Texto Original
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                      {anamnesis.texto_original}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-lg border-none bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      Texto convertido usando IA
                    </CardTitle>
                    <Button
                      onClick={() => copyText(generateSOAPText(), 'soap')}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {copied.soap ? (
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
                    readOnly
                    className="min-h-[300px] font-mono text-sm bg-white"
                  />
                </CardContent>
              </Card>


            </TabsContent>

            <TabsContent value="documentos" className="space-y-6">
              {savedDocs.filter(d => d.tipo === 'atestado').map(doc => (
                <Card key={doc.id} className="shadow-md border-l-4 border-l-blue-500 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">Atestado Salvo</p>
                        <p className="text-xs text-gray-600">
                          {doc.data_consulta} {doc.horario_consulta && `às ${doc.horario_consulta}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => editDocument(doc)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyText(doc.conteudo, 'atestado')}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteDocument(doc.id)} className="text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2 text-gray-700">{doc.conteudo}</p>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                      Atestado Médico
                    </CardTitle>
                    <div className="flex gap-2">
                      {atestadoTemplates.length > 0 && (
                        <Select onValueChange={(templateId) => loadTemplateForPrint(atestadoTemplates, templateId, 'atestado')}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Carregar modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            {atestadoTemplates.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {editData.atestado && (
                        <>
                          <Button
                            onClick={() => handlePrint("Atestado Médico", editData.atestado)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir
                          </Button>
                          <Button
                            onClick={() => copyText(editData.atestado, 'atestado')}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            {copied.atestado ? (
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
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data da Consulta *</Label>
                      <Input type="date" value={anamnesis.data_consulta} readOnly className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Horário</Label>
                      <Input 
                        type="time" 
                        id="horario-atestado"
                        placeholder="--:--"
                      />
                    </div>
                  </div>
                  <Textarea
                    value={editData.atestado}
                    onChange={(e) => setEditData({...editData, atestado: e.target.value})}
                    placeholder="Digite o texto do atestado médico aqui..."
                    className="min-h-[150px]"
                  />
                  <Button
                    onClick={() => {
                      const horario = document.getElementById('horario-atestado').value;
                      saveDocument('atestado', editData.atestado, horario);
                    }}
                    disabled={!editData.atestado.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Atestado
                  </Button>
                </CardContent>
              </Card>

              {savedDocs.filter(d => d.tipo === 'exame').map(doc => (
                <Card key={doc.id} className="shadow-md border-l-4 border-l-purple-500 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">Exame Salvo</p>
                        <p className="text-xs text-gray-600">
                          {doc.data_consulta} {doc.horario_consulta && `às ${doc.horario_consulta}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => editDocument(doc)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyText(doc.conteudo, 'exames')}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteDocument(doc.id)} className="text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2 text-gray-700">{doc.conteudo}</p>
                  </CardContent>
                </Card>
              ))}

              <Card className="shadow-lg border-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-purple-600" />
                      Exames Solicitados
                    </CardTitle>
                    <div className="flex gap-2">
                      {exameTemplates.length > 0 && (
                        <Select onValueChange={(templateId) => loadTemplateForPrint(exameTemplates, templateId, 'exames_solicitados')}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Carregar modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            {exameTemplates.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {editData.exames_solicitados && (
                        <>
                          <Button
                            onClick={() => handlePrint("Solicitação de Exames", editData.exames_solicitados)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir
                          </Button>
                          <Button
                            onClick={() => copyText(editData.exames_solicitados, 'exames')}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            {copied.exames ? (
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
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data da Consulta *</Label>
                      <Input type="date" value={anamnesis.data_consulta} readOnly className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Horário</Label>
                      <Input 
                        type="time" 
                        id="horario-exame"
                        placeholder="--:--"
                      />
                    </div>
                  </div>
                  <Textarea
                    value={editData.exames_solicitados}
                    onChange={(e) => setEditData({...editData, exames_solicitados: e.target.value})}
                    placeholder="Digite os exames laboratoriais e de imagem solicitados..."
                    className="min-h-[150px]"
                  />
                  <Button
                    onClick={() => {
                      const horario = document.getElementById('horario-exame').value;
                      saveDocument('exame', editData.exames_solicitados, horario);
                    }}
                    disabled={!editData.exames_solicitados.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Exame
                  </Button>
                </CardContent>
              </Card>

              {savedDocs.filter(d => d.tipo === 'encaminhamento').map(doc => (
                <Card key={doc.id} className="shadow-md border-l-4 border-l-green-500 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">Encaminhamento Salvo</p>
                        <p className="text-xs text-gray-600">
                          {doc.data_consulta} {doc.horario_consulta && `às ${doc.horario_consulta}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => editDocument(doc)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyText(doc.conteudo, 'encaminhamento')}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteDocument(doc.id)} className="text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2 text-gray-700">{doc.conteudo}</p>
                  </CardContent>
                </Card>
              ))}

              <Card className="shadow-lg border-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-green-600" />
                      Encaminhamento
                    </CardTitle>
                    <div className="flex gap-2">
                      {encaminhamentoTemplates.length > 0 && (
                        <Select onValueChange={(templateId) => loadTemplateForPrint(encaminhamentoTemplates, templateId, 'encaminhamento')}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Carregar modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            {encaminhamentoTemplates.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {editData.encaminhamento && (
                        <>
                          <Button
                            onClick={() => handlePrint("Encaminhamento Médico", editData.encaminhamento)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir
                          </Button>
                          <Button
                            onClick={() => copyText(editData.encaminhamento, 'encaminhamento')}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            {copied.encaminhamento ? (
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
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data da Consulta *</Label>
                      <Input type="date" value={anamnesis.data_consulta} readOnly className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Horário</Label>
                      <Input 
                        type="time" 
                        id="horario-encaminhamento"
                        placeholder="--:--"
                      />
                    </div>
                  </div>
                  <Textarea
                    value={editData.encaminhamento}
                    onChange={(e) => setEditData({...editData, encaminhamento: e.target.value})}
                    placeholder="Digite o encaminhamento para especialista..."
                    className="min-h-[150px]"
                  />
                  <Button
                    onClick={() => {
                      const horario = document.getElementById('horario-encaminhamento').value;
                      saveDocument('encaminhamento', editData.encaminhamento, horario);
                    }}
                    disabled={!editData.encaminhamento.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Encaminhamento
                  </Button>
                </CardContent>
              </Card>

              {savedDocs.filter(d => d.tipo === 'receita').map(doc => (
                <Card key={doc.id} className="shadow-md border-l-4 border-l-pink-500 bg-pink-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">Receita Salva</p>
                        <p className="text-xs text-gray-600">
                          {doc.data_consulta} {doc.horario_consulta && `às ${doc.horario_consulta}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => editDocument(doc)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyText(doc.conteudo, 'receita')}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteDocument(doc.id)} className="text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2 text-gray-700">{doc.conteudo}</p>
                  </CardContent>
                </Card>
              ))}

              <Card className="shadow-lg border-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5 text-pink-600" />
                      Receita Médica
                    </CardTitle>
                    <div className="flex gap-2">
                      {receitaTemplates.length > 0 && (
                        <Select onValueChange={(templateId) => loadTemplateForPrint(receitaTemplates, templateId, 'receita')}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Carregar modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            {receitaTemplates.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {editData.receita && (
                        <>
                          <Button
                            onClick={() => handlePrint("Receita Médica", editData.receita)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir
                          </Button>
                          <Button
                            onClick={() => copyText(editData.receita, 'receita')}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            {copied.receita ? (
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
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data da Consulta *</Label>
                      <Input type="date" value={anamnesis.data_consulta} readOnly className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Horário</Label>
                      <Input 
                        type="time" 
                        id="horario-receita"
                        placeholder="--:--"
                      />
                    </div>
                  </div>
                  <Textarea
                    value={editData.receita}
                    onChange={(e) => setEditData({...editData, receita: e.target.value})}
                    placeholder="Digite a receita médica..."
                    className="min-h-[150px]"
                  />
                  <Button
                    onClick={() => {
                      const horario = document.getElementById('horario-receita').value;
                      saveDocument('receita', editData.receita, horario);
                    }}
                    disabled={!editData.receita.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Receita
                  </Button>
                </CardContent>
              </Card>

              {savedDocs.filter(d => d.tipo === 'orientacoes').map(doc => (
                <Card key={doc.id} className="shadow-md border-l-4 border-l-amber-500 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">Orientações Salvas</p>
                        <p className="text-xs text-gray-600">
                          {doc.data_consulta} {doc.horario_consulta && `às ${doc.horario_consulta}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => editDocument(doc)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyText(doc.conteudo, 'orientacoes')}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteDocument(doc.id)} className="text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2 text-gray-700">{doc.conteudo}</p>
                  </CardContent>
                </Card>
              ))}

              <Card className="shadow-lg border-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-600" />
                      Orientações ao Paciente
                    </CardTitle>
                    <div className="flex gap-2">
                      {editData.orientacoes && (
                        <>
                          <Button
                            onClick={() => handlePrint("Orientações", editData.orientacoes)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir
                          </Button>
                          <Button
                            onClick={() => copyText(editData.orientacoes, 'orientacoes')}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            {copied.orientacoes ? (
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
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data da Consulta *</Label>
                      <Input type="date" value={anamnesis.data_consulta} readOnly className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Horário</Label>
                      <Input 
                        type="time" 
                        id="horario-orientacoes"
                        placeholder="--:--"
                      />
                    </div>
                  </div>
                  <Textarea
                    value={editData.orientacoes}
                    onChange={(e) => setEditData({...editData, orientacoes: e.target.value})}
                    placeholder="Digite as orientações ao paciente (cuidados, recomendações, sinais de alerta, etc.)..."
                    className="min-h-[150px]"
                  />
                  <Button
                    onClick={() => {
                      const horario = document.getElementById('horario-orientacoes').value;
                      saveDocument('orientacoes', editData.orientacoes, horario);
                    }}
                    disabled={!editData.orientacoes.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Orientações
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Excluir Anamnese
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              A anamnese será movida para a lixeira e poderá ser restaurada nos próximos 30 dias. 
              Após esse período, será excluída definitivamente.
            </p>
            <div>
              <Label htmlFor="reason">Motivo da Exclusão *</Label>
              <Textarea
                id="reason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Ex: Registro duplicado, erro de cadastro, paciente solicitou exclusão..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting || !deletionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Excluindo..." : "Mover para Lixeira"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}