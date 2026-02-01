import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer, Save } from "lucide-react";
import PrintableDocument from "./PrintableDocument";
import PatientSelector from "../anamnesis/PatientSelector";

export default function DocumentForm({ tipo, tipoLabel, icon: Icon, templateEntity, patient }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [patientName, setPatientName] = useState(patient?.nome || "");
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
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (patient?.nome) {
      setPatientName(patient.nome);
    }
  }, [patient]);

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

  const handleSave = async () => {
    if (!patientName.trim() || !conteudo.trim()) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSaving(true);
    const { MedicalDocument } = await import("@/entities/MedicalDocument");
    
    await MedicalDocument.create({
      tipo,
      patient_name: patientName,
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
            tipo={tipoLabel}
            paciente={patientName}
            dataConsulta={dataConsulta}
            conteudo={conteudo}
            cabecalho={templateData.cabecalho}
            rodape={templateData.rodape}
            logoUrl={templateData.logo_url}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-8">
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {Icon && <Icon className="w-8 h-8 text-indigo-600" />}
              {tipoLabel}
            </h1>
            <p className="text-gray-600 mt-1">Preencha os dados para gerar o documento</p>
          </div>
        </div>

        <div className="space-y-4">
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle>Informações do Paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient ? (
                   <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                     <Label className="text-xs text-gray-500 uppercase font-bold tracking-wide">Paciente</Label>
                     <p className="text-lg font-medium text-gray-900">{patientName}</p>
                   </div>
                ) : (
                  <PatientSelector
                    selectedPatient={patientName ? { nome: patientName } : null}
                    onSelect={(p) => setPatientName(p?.nome || "")}
                  />
                )}

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
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  value={conteudo}
                  onChange={setConteudo}
                  placeholder={`Digite o conteúdo do ${tipoLabel?.toLowerCase() || 'documento'}...`}
                  minHeight="300px"
                />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={isSaving || !patientName.trim() || !conteudo.trim()}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                onClick={handlePrint}
                disabled={!patientName.trim() || !conteudo.trim()}
                variant="outline"
                className="flex-1"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir / Salvar PDF
              </Button>
            </div>
        </div>
      </div>
    </>
  );
}