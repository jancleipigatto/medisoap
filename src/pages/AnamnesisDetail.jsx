import React, { useState, useEffect } from "react";
import { Anamnesis } from "@/entities/Anamnesis";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, ClipboardList, FileCheck, Send, Copy, Check, Printer, Trash2 } from "lucide-react";
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

export default function AnamnesisDetail() {
  const navigate = useNavigate();
  const [anamnesis, setAnamnesis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    atestado: "",
    exames_solicitados: "",
    encaminhamento: ""
  });
  const [copied, setCopied] = useState({
    soap: false,
    atestado: false,
    exames: false,
    encaminhamento: false
  });
  const [atestadoTemplates, setAtestadoTemplates] = useState([]);
  const [exameTemplates, setExameTemplates] = useState([]);
  const [encaminhamentoTemplates, setEncaminhamentoTemplates] = useState([]);
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
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (!id) {
        navigate(createPageUrl("Home"));
        return;
      }

      const data = await Anamnesis.list();
      const found = data.find(a => a.id === id);
      
      if (found) {
        setAnamnesis(found);
        setEditData({
          atestado: found.atestado || "",
          exames_solicitados: found.exames_solicitados || "",
          encaminhamento: found.encaminhamento || ""
        });
      } else {
        navigate(createPageUrl("Home"));
      }
      
      // Carregar templates
      const { AtestadoTemplate } = await import("@/entities/AtestadoTemplate");
      const { ExameTemplate } = await import("@/entities/ExameTemplate");
      const { EncaminhamentoTemplate } = await import("@/entities/EncaminhamentoTemplate");
      
      const atestados = await AtestadoTemplate.list("-created_date");
      const exames = await ExameTemplate.list("-created_date");
      const encaminhamentos = await EncaminhamentoTemplate.list("-created_date");
      
      setAtestadoTemplates(atestados);
      setExameTemplates(exames);
      setEncaminhamentoTemplates(encaminhamentos);
      
      setIsLoading(false);
    };

    loadAnamnesis();
  }, [navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    await Anamnesis.update(anamnesis.id, editData);
    setAnamnesis({...anamnesis, ...editData});
    setIsSaving(false);
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
              Imprimir / Salvar PDF
            </Button>
          </div>
          <PrintableDocument
            tipo={showPrintPreview.tipo}
            paciente={anamnesis.patient_name}
            dataConsulta={anamnesis.data_consulta}
            conteudo={showPrintPreview.conteudo}
            cabecalho={selectedTemplateData.cabecalho}
            rodape={selectedTemplateData.rodape}
            logoUrl={selectedTemplateData.logo_url}
          />
        </div>
      )}

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
                variant="outline"
                size="icon"
onClick={() => setShowDeleteDialog(true)}
className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="anamnese" className="w-full">
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
                      Texto Completo SOAP
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

              <Card className="shadow-lg border-none bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="text-2xl">Formato SOAP - Divisão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                        S
                      </div>
                      <h3 className="text-lg font-semibold text-green-700">Subjetivo</h3>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-gray-700 whitespace-pre-wrap">{anamnesis.subjetivo || "Não informado"}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        O
                      </div>
                      <h3 className="text-lg font-semibold text-blue-700">Objetivo</h3>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-gray-700 whitespace-pre-wrap">{anamnesis.objetivo || "Não informado"}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                        A
                      </div>
                      <h3 className="text-lg font-semibold text-purple-700">Avaliação</h3>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-gray-700 whitespace-pre-wrap">{anamnesis.avaliacao || "Não informado"}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                        P
                      </div>
                      <h3 className="text-lg font-semibold text-orange-700">Plano</h3>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-gray-700 whitespace-pre-wrap">{anamnesis.plano || "Não informado"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentos" className="space-y-6">
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
                <CardContent>
                  <Textarea
                    value={editData.atestado}
                    onChange={(e) => setEditData({...editData, atestado: e.target.value})}
                    placeholder="Digite o texto do atestado médico aqui..."
                    className="min-h-[150px]"
                  />
                </CardContent>
              </Card>

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
                <CardContent>
                  <Textarea
                    value={editData.exames_solicitados}
                    onChange={(e) => setEditData({...editData, exames_solicitados: e.target.value})}
                    placeholder="Digite os exames laboratoriais e de imagem solicitados..."
                    className="min-h-[150px]"
                  />
                </CardContent>
              </Card>

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
                <CardContent>
                  <Textarea
                    value={editData.encaminhamento}
                    onChange={(e) => setEditData({...editData, encaminhamento: e.target.value})}
                    placeholder="Digite o encaminhamento para especialista..."
                    className="min-h-[150px]"
                  />
                </CardContent>
              </Card>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isSaving ? "Salvando..." : "Salvar Documentos"}
              </Button>
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