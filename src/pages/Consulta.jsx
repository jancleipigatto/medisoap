import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Calendar, ArrowRight, CheckCircle, Plus, ArrowLeft } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import PermissionGuard from "../components/PermissionGuard";

export default function Consulta() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadAgendamentos();
  }, [selectedDate]);

  const loadAgendamentos = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.Agendamento.list("-data_agendamento");
      
      let filtered = data.filter(ag => isSameDay(parseISO(ag.data_agendamento), selectedDate));
      
      // If user is doctor (can create anamnesis) and NOT master/manager, filter by professional
      if (user.can_create_anamnesis && !user.is_master && !user.can_manage_schedule) {
          filtered = filtered.filter(ag => ag.professional_id === user.id);
      }
      
      // Sort: Priority to those waiting (recepcionado, em_triagem, etc)
      // But showing ALL as requested
      setAgendamentos(filtered.sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio)));
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttend = async (agendamento) => {
    // Check if there is an existing Anamnesis for this patient today (e.g. from Triage)
    try {
      const anamneses = await base44.entities.Anamnesis.list();
      // Filter manually for efficiency if needed, or rely on sorting
      // Logic: Same patient, same day, not cancelled
      const today = new Date();
      const existing = anamneses.find(a => 
        a.patient_id === agendamento.patient_id && 
        isSameDay(parseISO(a.data_consulta), selectedDate) &&
        !a.is_cancelled
      );

      if (existing) {
        // Update appointment status to em_atendimento if not already
        if (agendamento.status !== 'em_atendimento' && agendamento.status !== 'realizado') {
             await base44.entities.Agendamento.update(agendamento.id, { status: "em_atendimento" });
             // Also link appointment if not linked
             if (!existing.appointment_id) {
                 await base44.entities.Anamnesis.update(existing.id, { appointment_id: agendamento.id });
             }
        }
        navigate(`${createPageUrl("NewAnamnesis")}?continue=${existing.id}`);
      } else {
        // Start new
        navigate(`${createPageUrl("NewAnamnesis")}?patient_id=${agendamento.patient_id}&appointment_id=${agendamento.id}`);
      }
    } catch (e) {
      console.error("Error checking existing anamnesis", e);
      // Fallback
      navigate(`${createPageUrl("NewAnamnesis")}?patient_id=${agendamento.patient_id}&appointment_id=${agendamento.id}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'recepcionado': return 'bg-green-50 border-l-4 border-green-500';
      case 'aguardando_triagem': return 'bg-green-50 border-l-4 border-green-500';
      case 'em_triagem': return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'aguardando_atendimento': return 'bg-blue-50 border-l-4 border-blue-500';
      case 'em_atendimento': return 'bg-purple-50 border-l-4 border-purple-500';
      case 'realizado': return 'bg-gray-100 border-l-4 border-gray-500 opacity-70';
      default: return 'bg-white';
    }
  };

  return (
    <PermissionGuard permission="can_create_anamnesis">
      <div className="p-4 md:p-8 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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
                  <Stethoscope className="w-8 h-8 text-indigo-600" />
                  Consulta
                </h1>
                <p className="text-gray-600 mt-1">Gerencie os atendimentos do dia</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(createPageUrl("NewAnamnesis"))}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Incluir Consulta
              </Button>
            </div>
          </div>

          <Card className="shadow-lg border-none mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Pacientes do Dia</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() - 1)))}>←</Button>
                  <span className="font-medium">{format(selectedDate, "dd/MM/yyyy")}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() + 1)))}>→</Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Hoje</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Recepção</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agendamentos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Nenhum paciente agendado para esta data
                        </TableCell>
                      </TableRow>
                    ) : (
                      agendamentos.map((ag) => (
                        <TableRow key={ag.id} className={getStatusColor(ag.status)}>
                          <TableCell className="font-medium">{ag.horario_inicio}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {ag.horario_recepcao || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{ag.patient_name}</span>
                              <span className="text-xs text-indigo-600 font-medium">Dr(a). {ag.professional_name || "N/A"}</span>
                              {ag.telefone_contato && <span className="text-xs text-gray-500">{ag.telefone_contato}</span>}
                              {ag.observacoes && ag.observacoes.includes("Não recepcionado") && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1 w-fit">
                                  Não recepcionado
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{ag.tipo?.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge variant={
                              ['recepcionado', 'em_triagem', 'aguardando_atendimento'].includes(ag.status) 
                                ? 'success' 
                                : 'outline'
                            }>
                              {ag.status?.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {ag.status !== 'realizado' && ag.status !== 'cancelado' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleAttend(ag)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  Atender
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-500 font-medium flex items-center justify-end px-3">
                                  {ag.status === 'realizado' && <CheckCircle className="w-4 h-4 mr-1 text-green-500" />}
                                  {ag.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}