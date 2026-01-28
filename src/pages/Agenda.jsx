import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Plus, Clock, User, Phone, FileText, ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import PermissionGuard from "../components/PermissionGuard";
import PatientSelector from "../components/anamnesis/PatientSelector";

export default function Agenda() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState("day"); // day, week
  const [formData, setFormData] = useState({
    patient_id: "",
    patient_name: "",
    data_agendamento: format(new Date(), "yyyy-MM-dd"),
    horario_inicio: "",
    horario_fim: "",
    tipo: "primeira_consulta",
    status: "agendado",
    telefone_contato: "",
    observacoes: ""
  });

  useEffect(() => {
    loadAgendamentos();
  }, []);

  const loadAgendamentos = async () => {
    setIsLoading(true);
    const data = await base44.entities.Agendamento.list("-data_agendamento");
    setAgendamentos(data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.patient_name || !formData.data_agendamento || !formData.horario_inicio) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    if (editingId) {
      await base44.entities.Agendamento.update(editingId, formData);
    } else {
      await base44.entities.Agendamento.create(formData);
    }

    await loadAgendamentos();
    handleCloseDialog();
  };

  const handleDelete = async (id) => {
    if (!confirm("Deseja excluir este agendamento?")) return;
    await base44.entities.Agendamento.delete(id);
    await loadAgendamentos();
  };

  const handleEdit = (agendamento) => {
    setEditingId(agendamento.id);
    setFormData({
      patient_id: agendamento.patient_id || "",
      patient_name: agendamento.patient_name,
      data_agendamento: agendamento.data_agendamento,
      horario_inicio: agendamento.horario_inicio,
      horario_fim: agendamento.horario_fim || "",
      tipo: agendamento.tipo,
      status: agendamento.status,
      telefone_contato: agendamento.telefone_contato || "",
      observacoes: agendamento.observacoes || ""
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingId(null);
    setFormData({
      patient_id: "",
      patient_name: "",
      data_agendamento: format(new Date(), "yyyy-MM-dd"),
      horario_inicio: "",
      horario_fim: "",
      tipo: "primeira_consulta",
      status: "agendado",
      telefone_contato: "",
      observacoes: ""
    });
  };

  const getAgendamentosByDate = (date) => {
    return agendamentos.filter(ag => 
      isSameDay(parseISO(ag.data_agendamento), date)
    ).sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio));
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { locale: ptBR });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const statusColors = {
    agendado: "bg-blue-100 text-blue-800",
    confirmado: "bg-green-100 text-green-800",
    realizado: "bg-gray-100 text-gray-800",
    cancelado: "bg-red-100 text-red-800",
    faltou: "bg-orange-100 text-orange-800"
  };

  const statusIcons = {
    agendado: <Clock className="w-4 h-4" />,
    confirmado: <CheckCircle className="w-4 h-4" />,
    realizado: <CheckCircle className="w-4 h-4" />,
    cancelado: <XCircle className="w-4 h-4" />,
    faltou: <AlertCircle className="w-4 h-4" />
  };

  const tipoLabels = {
    primeira_consulta: "Primeira Consulta",
    retorno: "Retorno",
    procedimento: "Procedimento",
    exame: "Exame"
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="can_create_anamnesis">
      <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
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
                  <Calendar className="w-8 h-8 text-blue-600" />
                  Agenda
                </h1>
                <p className="text-gray-600 mt-1">Gerencie seus agendamentos</p>
              </div>
            </div>
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>

          <div className="mb-6 flex gap-4 items-center">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                onClick={() => setViewMode("day")}
                size="sm"
              >
                Dia
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
                size="sm"
              >
                Semana
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, viewMode === "day" ? -1 : -7))}
              >
                ←
              </Button>
              <Input
                type="date"
                value={format(selectedDate, "yyyy-MM-dd")}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-auto"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, viewMode === "day" ? 1 : 7))}
              >
                →
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Hoje
              </Button>
            </div>
          </div>

          {viewMode === "day" ? (
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle>
                  {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getAgendamentosByDate(selectedDate).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum agendamento para este dia</p>
                    </div>
                  ) : (
                    getAgendamentosByDate(selectedDate).map(ag => (
                      <Card key={ag.id} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                  <Clock className="w-5 h-5 text-blue-600" />
                                  {ag.horario_inicio}
                                  {ag.horario_fim && ` - ${ag.horario_fim}`}
                                </div>
                                <Badge className={statusColors[ag.status]}>
                                  <span className="flex items-center gap-1">
                                    {statusIcons[ag.status]}
                                    {ag.status}
                                  </span>
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-gray-900 font-medium mb-1">
                                <User className="w-4 h-4 text-gray-500" />
                                {ag.patient_name}
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                {tipoLabels[ag.tipo]}
                              </div>
                              {ag.telefone_contato && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  {ag.telefone_contato}
                                </div>
                              )}
                              {ag.observacoes && (
                                <div className="flex items-start gap-2 text-sm text-gray-600 mt-2">
                                  <FileText className="w-4 h-4 mt-0.5" />
                                  <span>{ag.observacoes}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(createPageUrl("Triagem"))}
                                className="text-green-600 hover:text-green-700"
                              >
                                Iniciar Triagem
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(ag)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(ag.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-7 gap-4">
              {getWeekDays().map(day => (
                <Card key={day.toISOString()} className="shadow-lg border-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-center">
                      {format(day, "EEE", { locale: ptBR })}
                      <br />
                      <span className="text-2xl font-bold">{format(day, "dd")}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {getAgendamentosByDate(day).length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Sem agendamentos</p>
                    ) : (
                      getAgendamentosByDate(day).map(ag => (
                        <Card
                          key={ag.id}
                          className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleEdit(ag)}
                        >
                          <CardContent className="p-2">
                            <div className="text-xs font-semibold text-blue-600 mb-1">
                              {ag.horario_inicio}
                            </div>
                            <div className="text-xs text-gray-900 font-medium truncate">
                              {ag.patient_name}
                            </div>
                            <Badge className={`${statusColors[ag.status]} text-[10px] mt-1`}>
                              {ag.status}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Agendamento" : "Novo Agendamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Paciente *</Label>
              <PatientSelector
                selectedPatient={formData.patient_name ? { nome: formData.patient_name, id: formData.patient_id } : null}
                onSelect={(patient) => {
                  setFormData({
                    ...formData,
                    patient_id: patient?.id || "",
                    patient_name: patient?.nome || ""
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data_agendamento}
                  onChange={(e) => setFormData({ ...formData, data_agendamento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de Consulta</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primeira_consulta">Primeira Consulta</SelectItem>
                    <SelectItem value="retorno">Retorno</SelectItem>
                    <SelectItem value="procedimento">Procedimento</SelectItem>
                    <SelectItem value="exame">Exame</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inicio">Horário Início *</Label>
                <Input
                  id="inicio"
                  type="time"
                  value={formData.horario_inicio}
                  onChange={(e) => setFormData({ ...formData, horario_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="fim">Horário Fim</Label>
                <Input
                  id="fim"
                  type="time"
                  value={formData.horario_fim}
                  onChange={(e) => setFormData({ ...formData, horario_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="realizado">Realizado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="faltou">Faltou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="telefone">Telefone de Contato</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone_contato}
                  onChange={(e) => setFormData({ ...formData, telefone_contato: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                placeholder="Notas adicionais sobre o agendamento..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {editingId ? "Atualizar" : "Criar"} Agendamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}