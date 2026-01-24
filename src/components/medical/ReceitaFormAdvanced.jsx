import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Printer, Save, Pill, Star, Plus, X, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PrintableDocument from "./PrintableDocument";
import { ReceitaTemplate } from "@/entities/ReceitaTemplate";

export default function ReceitaFormAdvanced() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [patientName, setPatientName] = useState("");
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
  
  // Template medications dialog
  const [showTemplateMeds, setShowTemplateMeds] = useState(false);
  const [templateMedications, setTemplateMedications] = useState([]);
  const [selectedMeds, setSelectedMeds] = useState([]);
  
  // Medication search
  const [searchMedicamento, setSearchMedicamento] = useState("");
  const [medicamentos, setMedicamentos] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (searchMedicamento.length >= 2) {
      const timer = setTimeout(() => {
        searchMedicamentos(searchMedicamento);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setMedicamentos([]);
    }
  }, [searchMedicamento]);

  const loadTemplates = async () => {
    const data = await ReceitaTemplate.list("-created_date");
    setTemplates(data);
  };

  const searchMedicamentos = async (searchTerm) => {
    try {
      setIsSearching(true);
      const { Medicamento } = await import("@/entities/Medicamento");
      const allMedicamentos = await Medicamento.list("-created_date");
      const filtered = allMedicamentos.filter(med => 
        med.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setMedicamentos(filtered);
      setIsSearching(false);
    } catch (error) {
      console.error("Erro ao buscar medicamentos:", error);
      setIsSearching(false);
    }
  };

  const parseMedicationsFromTemplate = (templateText) => {
    const lines = templateText.split('\n');
    const medications = [];
    let currentMed = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Se é uma linha de via de administração, pula
      if (trimmed.startsWith('USO ')) return;
      
      // Se tem " - ", é o nome do medicamento com quantidade
      if (trimmed.includes(' - ')) {
        if (currentMed) medications.push(currentMed);
        currentMed = {
          id: Date.now() + Math.random(),
          nome: trimmed,
          posologia: ''
        };
      } else if (currentMed) {
        // É a posologia do medicamento atual
        currentMed.posologia = trimmed;
      }
    });
    
    if (currentMed) medications.push(currentMed);
    return medications;
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Parse medications from template
      const meds = parseMedicationsFromTemplate(template.template_texto);
      setTemplateMedications(meds);
      setSelectedMeds(meds.map(m => m.id));
      setTemplateData({
        cabecalho: template.cabecalho || "",
        rodape: template.rodape || "",
        logo_url: template.logo_url || ""
      });
      setShowTemplateMeds(true);
    }
  };

  const handleAddMedicationsFromTemplate = () => {
    const medsToAdd = templateMedications
      .filter(med => selectedMeds.includes(med.id))
      .map(med => `${med.nome}\n${med.posologia}`)
      .join('\n\n');
    
    setConteudo(prev => prev ? `${prev}\n\n${medsToAdd}` : medsToAdd);
    setShowTemplateMeds(false);
  };

  const handleAddMedicamentoFromDatabase = (med) => {
    const medText = `${med.nome}${med.apresentacao ? ` - ${med.apresentacao}` : ''}\n${med.posologia || ''}`;
    setConteudo(prev => prev ? `${prev}\n\n${medText}` : medText);
    setSearchMedicamento("");
    setOpen(false);
  };

  const handleSave = async () => {
    if (!patientName.trim() || !conteudo.trim()) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSaving(true);
    const { MedicalDocument } = await import("@/entities/MedicalDocument");
    
    await MedicalDocument.create({
      tipo: "receita",
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

  const toggleSelectAll = () => {
    if (selectedMeds.length === templateMedications.length) {
      setSelectedMeds([]);
    } else {
      setSelectedMeds(templateMedications.map(m => m.id));
    }
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
            paciente={patientName}
            dataConsulta={dataConsulta}
            conteudo={conteudo}
            cabecalho={templateData.cabecalho}
            rodape={templateData.rodape}
            logoUrl={templateData.logo_url}
          />
        </div>
      )}

      <Dialog open={showTemplateMeds} onOpenChange={setShowTemplateMeds}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medicamentos do Modelo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                {selectedMeds.length === templateMedications.length ? "Desmarcar Todos" : "Adicionar Todos"}
              </Button>
              {selectedMeds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMeds([])}
                  className="gap-2 text-red-600"
                >
                  <X className="w-4 h-4" />
                  Excluir Selecionados ({selectedMeds.length})
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {templateMedications.map((med) => (
                <Card key={med.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedMeds.includes(med.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMeds([...selectedMeds, med.id]);
                        } else {
                          setSelectedMeds(selectedMeds.filter(id => id !== med.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{med.nome}</p>
                      <p className="text-xs text-gray-600 mt-1">{med.posologia}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowTemplateMeds(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMedicationsFromTemplate} className="bg-blue-600 hover:bg-blue-700">
              Adicionar Medicamentos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              <p className="text-gray-600 mt-1">Preencha as informações do documento</p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle>Informações do Paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="patient">Nome do Paciente *</Label>
                  <Input
                    id="patient"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Digite o nome completo do paciente"
                  />
                </div>

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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {selectedTemplate
                            ? templates.find((t) => t.id === selectedTemplate)?.nome
                            : "Selecione um modelo"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar modelo..." />
                          <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
                          <CommandGroup>
                            {templates.map((template) => (
                              <CommandItem
                                key={template.id}
                                value={template.nome}
                                onSelect={() => handleTemplateSelect(template.id)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedTemplate === template.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {template.nome}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Descrição</CardTitle>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Adicionar Medicamento
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-0" align="end">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar medicamento..." 
                          value={searchMedicamento}
                          onValueChange={setSearchMedicamento}
                        />
                        <CommandEmpty>
                          {searchMedicamento.length < 2 
                            ? "Digite ao menos 2 caracteres" 
                            : "Nenhum medicamento encontrado"}
                        </CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {medicamentos.map((med) => (
                            <CommandItem
                              key={med.id}
                              value={med.nome}
                              onSelect={() => handleAddMedicamentoFromDatabase(med)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-start gap-2 w-full">
                                <Pill className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">{med.nome}</p>
                                    {med.uso_frequente && (
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    )}
                                  </div>
                                  {med.apresentacao && (
                                    <p className="text-xs text-gray-600">{med.apresentacao}</p>
                                  )}
                                  {med.posologia && (
                                    <p className="text-xs text-gray-700 mt-1">{med.posologia}</p>
                                  )}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Digite o conteúdo da receita..."
                  className="min-h-[300px]"
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
      </div>
    </>
  );
}