import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Calendar, Plus, Clock, Search, Edit, ArrowRight, Camera, Upload, CheckCircle } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import PermissionGuard from "../components/PermissionGuard";
import PatientSelector from "../components/anamnesis/PatientSelector";
import PatientFormDialog from "../components/patients/PatientFormDialog";

export default function Recepcao() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // States for Modals
  const [showAddAgendamento, setShowAddAgendamento] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showRecepcaoModal, setShowRecepcaoModal] = useState(false);
  
  // Data for Modals
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [recepcaoPhoto, setRecepcaoPhoto] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // New Agendamento Form
  const [newAgendamentoData, setNewAgendamentoData] = useState({
    patient_id: "",
    patient_name: "",
    horario_inicio: "",
    tipo: "primeira_consulta"
  });

  useEffect(() => {
    loadAgendamentos();
  }, [selectedDate]);

  const loadAgendamentos = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Agendamento.list("-data_agendamento");
      const filtered = data.filter(ag => isSameDay(parseISO(ag.data_agendamento), selectedDate));
      setAgendamentos(filtered.sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio)));
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAgendamento = async () => {
    if (!newAgendamentoData.patient_name || !newAgendamentoData.horario_inicio) {
      alert("Preencha o paciente e o horário");
      return;
    }

    try {
      await base44.entities.Agendamento.create({
        ...newAgendamentoData,
        data_agendamento: format(selectedDate, "yyyy-MM-dd"),
        status: "agendado"
      });
      setShowAddAgendamento(false);
      setNewAgendamentoData({ patient_id: "", patient_name: "", horario_inicio: "", tipo: "primeira_consulta" });
      loadAgendamentos();
    } catch (error) {
      console.error("Erro ao agendar:", error);
      alert("Erro ao criar agendamento");
    }
  };

  const handleOpenRecepcao = (agendamento) => {
    setSelectedAgendamento(agendamento);
    setRecepcaoPhoto(agendamento.foto_url || null);
    setShowRecepcaoModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setRecepcaoPhoto(file_url);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao enviar foto");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleConfirmRecepcao = async () => {
    try {
      await base44.entities.Agendamento.update(selectedAgendamento.id, {
        status: "recepcionado",
        foto_url: recepcaoPhoto
      });
      setShowRecepcaoModal(false);
      loadAgendamentos();
    } catch (error) {
      console.error("Erro ao recepcionar:", error);
      alert("Erro ao confirmar recepção");
    }
  };

  const handleEditPatient = async (agendamento) => {
    // Buscar dados completos do paciente
    try {
      const patients = await base44.entities.Patient.list();
      const patient = patients.find(p => p.id === agendamento.patient_id);
      if (patient) {
        setEditingPatient(patient);
        setShowPatientForm(true);
      } else {
        alert("Paciente não encontrado no cadastro");
      }
    } catch (error) {
      console.error("Erro ao buscar paciente:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'recepcionado': return 'bg-green-50 border-l-4 border-green-500';
      case 'aguardando_triagem': return 'bg-green-50 border-l-4 border-green-500';
      case 'em_triagem': return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'aguardando_atendimento': return 'bg-blue-50 border-l-4 border-blue-500';
      case 'atendimento_realizado': return 'bg-gray-50 border-l-4 border-gray-500';
      case 'realizado': return 'bg-gray-50 border-l-4 border-gray-500';
      default: return 'bg-white';
    }
  };

  return (
    <PermissionGuard permission="can_access_reception">
      <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                Recepção
              </h1>
              <p className="text-gray-600 mt-1">Gerencie a chegada de pacientes</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddAgendamento(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Incluir (Encaixe)
              </Button>
              <Button
                onClick={() => { setEditingPatient(null); setShowPatientForm(true); }}
                variant="outline"
                className="bg-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Paciente
              </Button>
            </div>
          </div>

          <Card className="shadow-lg border-none mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Agendamentos de Hoje</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() - 1)))}>←</Button>
                  <span className="font-medium">{format(selectedDate, "dd/MM/yyyy")}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() + 1)))}>→</Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Hoje</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
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
                          Nenhum agendamento para esta data
                        </TableCell>
                      </TableRow>
                    ) : (
                      agendamentos.map((ag) => (
                        <TableRow key={ag.id} className={getStatusColor(ag.status)}>
                          <TableCell className="font-medium">{ag.horario_inicio}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{ag.patient_name}</span>
                              {ag.telefone_contato && <span className="text-xs text-gray-500">{ag.telefone_contato}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{ag.tipo.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge variant={ag.status === 'recepcionado' ? 'success' : 'outline'}>
                              {ag.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPatient(ag)}
                                title="Atualizar Dados"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {ag.status === 'agendado' || ag.status === 'confirmado' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenRecepcao(ag)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Recepcionar
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              ) : (
                                <span className="text-xs text-green-700 font-medium flex items-center justify-end px-3">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Recepcionado
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

        {/* Modal Incluir Agendamento */}
        <Dialog open={showAddAgendamento} onOpenChange={setShowAddAgendamento}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Incluir Paciente (Encaixe)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Paciente</Label>
                <PatientSelector
                  onSelect={(p) => setNewAgendamentoData({...newAgendamentoData, patient_id: p.id, patient_name: p.nome})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={newAgendamentoData.horario_inicio}
                    onChange={(e) => setNewAgendamentoData({...newAgendamentoData, horario_inicio: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={newAgendamentoData.tipo}
                    onValueChange={(v) => setNewAgendamentoData({...newAgendamentoData, tipo: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primeira_consulta">Primeira Consulta</SelectItem>
                      <SelectItem value="retorno">Retorno</SelectItem>
                      <SelectItem value="exame">Exame</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddAgendamento} className="w-full mt-4">Confirmar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Recepcionar */}
        <Dialog open={showRecepcaoModal} onOpenChange={setShowRecepcaoModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Recepcionar Paciente</DialogTitle>
            </DialogHeader>
            {selectedAgendamento && (
              <div className="space-y-6 py-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-bold text-lg">{selectedAgendamento.patient_name}</p>
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>Horário: {selectedAgendamento.horario_inicio}</span>
                    <span className="capitalize">Tipo: {selectedAgendamento.tipo.replace('_', ' ')}</span>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Foto do Paciente (Opcional)</Label>
                  <div className="flex flex-col items-center gap-4 border-2 border-dashed border-gray-300 rounded-lg p-6">
                    {recepcaoPhoto ? (
                      <div className="relative">
                        <img src={recepcaoPhoto} alt="Foto Paciente" className="w-32 h-32 object-cover rounded-full shadow-md" />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => setRecepcaoPhoto(null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <User className="w-16 h-16" />
                      </div>
                    )}
                    
                    <div className="flex gap-2 w-full">
                      <Button variant="outline" className="flex-1 relative" disabled={isUploadingPhoto}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Foto
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                        />
                      </Button>
                    </div>
                    {isUploadingPhoto && <p className="text-xs text-blue-600">Enviando foto...</p>}
                  </div>
                </div>

                <Button onClick={handleConfirmRecepcao} className="w-full bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Recepção & Liberar Triagem
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Criar/Editar Paciente */}
        <PatientFormDialog
          open={showPatientForm}
          onOpenChange={setShowPatientForm}
          patientToEdit={editingPatient}
          onSuccess={() => {
            loadAgendamentos(); // Reload to update names if changed
          }}
        />
      </div>
    </PermissionGuard>
  );
}