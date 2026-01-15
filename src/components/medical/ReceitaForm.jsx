import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer, Save, Pill, Sparkles, Loader2 } from "lucide-react";
import PrintableDocument from "./PrintableDocument";
import PatientSelector from "../anamnesis/PatientSelector";
import { InvokeLLM } from "@/integrations/Core";

export default function ReceitaForm({ templateEntity }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0]);
  const [horarioConsulta, setHorarioConsulta] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateData, setTemplateData] = useState({
    cabecalho: "",
    rodape: "",
    logo_url: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await templateEntity.list("-created_date");
    setTemplates(data);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setConteudo(template.template_texto);
      setTemplateData({
        cabecalho: template.cabecalho || "",
        rodape: template.rodape || "",
        logo_url: template.logo_url || ""
      });
    }
  };

  const convertToTemplate = async () => {
    if (!conteudo.trim()) {
      alert("Preencha o conteúdo da receita");
      return;
    }

    setIsConverting(true);
    
    const prompt = `Você é um assistente médico. Converta o seguinte texto em uma receita médica profissional e bem formatada.

Texto original:
${conteudo}

Formate como uma receita médica padrão, mantendo todas as informações importantes, doses, e orientações. Use formatação clara com quebras de linha apropriadas.`;

    const result = await InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          receita_formatada: { type: "string" }
        }
      }
    });

    setConteudo(result.receita_formatada);
    setIsConverting(false);
  };

  const handleSave = async () => {
    if (!selectedPatient || !conteudo.trim()) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSaving(true);
    const { MedicalDocument } = await import("@/entities/MedicalDocument");
    
    await MedicalDocument.create({
      tipo: "receita",
      patient_name: selectedPatient.nome,
      data_consulta: dataConsulta,
      horario_consulta: horarioConsulta,
      conteudo,
      template_id: selectedTemplate,
      cabecalho: templateData.cabecalho,
      rodape: templateData.rodape,
      logo_url: templateData.logo_url
    });

    setIsSaving(false);
    navigate(createPageUrl("Home"));
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <>
      {showPrintPreview && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <div className="no-print p-4 flex justify-end gap-2 bg-gray-100">
            <Button onClick={() => setShowPrintPreview(false)} variant="outline">
              Fechar
            </Button>
            <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir / Salvar PDF
            </Button>
          </div>
          <PrintableDocument
            tipo="Receita Médica"
            paciente={selectedPatient?.nome}
            dataConsulta={dataConsulta}
            conteudo={conteudo}
            cabecalho={templateData.cabecalho}
            rodape={templateData.rodape}
            logoUrl={templateData.logo_url}
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Pill className="w-8 h-8" />
                Nova Receita Médica
              </h1>
              <p className="text-gray-600 mt-1">Preencha as informações da receita</p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle>Informações do Paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PatientSelector
                  selectedPatient={selectedPatient}
                  onSelect={setSelectedPatient}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data">Data da Consulta *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={dataConsulta}
                      onChange={(e) => setDataConsulta(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="horario">Horário</Label>
                    <Input
                      id="horario"
                      type="time"
                      value={horarioConsulta}
                      onChange={(e) => setHorarioConsulta(e.target.value)}
                    />
                  </div>
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
                <CardTitle>Conteúdo da Receita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Digite o conteúdo da receita médica..."
                  className="min-h-[300px]"
                />
                
                <Button
                  onClick={convertToTemplate}
                  disabled={isConverting || !conteudo.trim()}
                  variant="outline"
                  className="w-full"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Convertendo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Converter para Modelo Padrão com IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={isSaving || !selectedPatient || !conteudo.trim()}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                onClick={handlePrint}
                disabled={!selectedPatient || !conteudo.trim()}
                variant="outline"
                className="flex-1"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir / Salvar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}