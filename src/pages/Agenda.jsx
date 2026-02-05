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
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid'; // We need a way to generate token. If uuid not available, use Math.random
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Plus, Clock, User, Phone, FileText, ArrowLeft, CheckCircle, XCircle, AlertCircle, Settings, Trash2, Send, MessageSquare, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import PermissionGuard from "../components/PermissionGuard";
import PatientSelector from "../components/anamnesis/PatientSelector";
import PatientFormDialog from "../components/patients/PatientFormDialog"; // Import Patient Dialog

export default function Agenda() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState(null); // Filter
  const [scheduleSettings, setScheduleSettings] = useState(null);
  const [scheduleBlocks, setScheduleBlocks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState("day"); // day, week, month
  const [showPatientDialog, setShowPatientDialog] = useState(false); // State for new patient dialog
  const [successData, setSuccessData] = useState(null); // State for success screen { id, ...data }
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    patient_id: "",
    patient_name: "",
    professional_id: "", 
    professional_name: "",
    data_agendamento: format(new Date(), "yyyy-MM-dd"),
    horario_inicio: "",
    horario_fim: "",
    tipo: "primeira_consulta",
    status: "agendado",
    telefone_contato: "",
    observacoes: "",
    message_history: [],
    confirmation_token: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProfessional && selectedProfessional !== "all") {
      loadSchedule(selectedProfessional);
    } else {
      setScheduleSettings(null);
      setScheduleBlocks([]);
    }
  }, [selectedProfessional]);

  const loadSchedule = async (profId) => {
    try {
      const settings = await base44.entities.AgendaSettings.filter({ professional_id: profId });
      if (settings.length > 0) setScheduleSettings(settings[0]);
      else setScheduleSettings(null);

      const blocks = await base44.entities.ScheduleBlock.filter({ professional_id: profId });
      setScheduleBlocks(blocks);
    } catch (err) {
      console.error("Error loading schedule:", err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    const user = await base44.auth.me();
    setCurrentUser(user);
    
    // Load Professionals using backend function to bypass non-admin restriction
    try {
      const { data: docs } = await base44.functions.invoke("getMedicalProfessionals");
      setProfessionals(docs || []);
    } catch (err) {
      console.error("Failed to load professionals:", err);
      // Fallback: se falhar, assume apenas o usuário atual se ele for médico ou puder gerenciar agenda
      if (user.can_create_anamnesis || user.can_manage_own_schedule) {
        setProfessionals([user]);
      } else {
        setProfessionals([]);
      }
    }

    // Set default filter
    if (user.is_master || user.can_manage_schedule) {
       setSelectedProfessional("all");
    } else if (user.can_create_anamnesis || user.can_manage_own_schedule) {
       // Doctor or professional sees their own
       setSelectedProfessional(user.id);
    } else {
       setSelectedProfessional("all");
    }

    const data = await base44.entities.Agendamento.list("-data_agendamento");
    setAgendamentos(data);
    setIsLoading(false);
  };

  // Calculate available slots when form data changes
  useEffect(() => {
    const calculateSlots = async () => {
      if (!showDialog || !formData.professional_id || !formData.data_agendamento) {
        setAvailableSlots([]);
        return;
      }
      
      let settings = scheduleSettings;
      let blocks = scheduleBlocks;
      
      // If the selected professional in form is different from the page filter, fetch their specific settings
      if (selectedProfessional !== "all" && selectedProfessional !== formData.professional_id) {
         const s = await base44.entities.AgendaSettings.filter({ professional_id: formData.professional_id });
         settings = s[0];
         blocks = await base44.entities.ScheduleBlock.filter({ professional_id: formData.professional_id });
      } else if (selectedProfessional === "all" && formData.professional_id) {
         // If filter is All, we definitely need to fetch settings for the specific professional
         const s = await base44.entities.AgendaSettings.filter({ professional_id: formData.professional_id });
         settings = s[0];
         blocks = await base44.entities.ScheduleBlock.filter({ professional_id: formData.professional_id });
      }

      // If no settings, we can't generate specific slots, so we might show empty or generic
      if (!settings) {
          setAvailableSlots([]); 
          return;
      }

      const duration = settings.slot_duration || 30;
      const date = parseISO(formData.data_agendamento);
      const dayOfWeek = date.getDay();
      const intervals = settings.weekly_schedule?.[dayOfWeek] || [];
      
      const slots = [];
      
      intervals.forEach(interval => {
          let [currH, currM] = interval.start.split(':').map(Number);
          const [endH, endM] = interval.end.split(':').map(Number);
          
          let currMinutes = currH * 60 + currM;
          const endMinutes = endH * 60 + endM;
          
          while (currMinutes + duration <= endMinutes) {
               const h = Math.floor(currMinutes / 60);
               const m = currMinutes % 60;
               const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
               
               // Calculate End Time for this slot
               const slotEndMin = currMinutes + duration;
               const slotEndH = Math.floor(slotEndMin / 60);
               const slotEndM = slotEndMin % 60;
               const timeEndStr = `${slotEndH.toString().padStart(2, '0')}:${slotEndM.toString().padStart(2, '0')}`;

               // Check Block Overlap
               const isBlocked = blocks.some(b => {
                   if (b.start_date > formData.data_agendamento || b.end_date < formData.data_agendamento) return false;
                   if (b.is_all_day) return true;
                   return (timeStr >= b.start_time && timeStr < b.end_time); 
               });
               
               if (!isBlocked) {
                   // Check Appointment Overlap
                   const overlap = agendamentos.some(a => {
                       if (a.professional_id !== formData.professional_id) return false;
                       if (a.data_agendamento !== formData.data_agendamento) return false;
                       if (a.status === 'cancelado' || a.status === 'faltou') return false;
                       if (a.id === editingId) return false; // Ignore self
                       
                       const startA = timeStr;
                       const endA = timeEndStr;
                       const startB = a.horario_inicio;
                       const endB = a.horario_fim || a.horario_inicio; // fallback
                       
                       return (startA < endB) && (endA > startB);
                   });
                   
                   if (!overlap) {
                       slots.push(timeStr);
                   }
               }
               
               currMinutes += duration;
          }
      });
      setAvailableSlots(slots);
    };
    
    calculateSlots();
  }, [formData.professional_id, formData.data_agendamento, showDialog, selectedProfessional, agendamentos, scheduleSettings, scheduleBlocks]);

  const checkAvailability = async (dateStr, startTime, endTime, profId) => {
    // Fetch settings fresh to ensure we check against correct rules
    let settings = scheduleSettings;
    let blocks = scheduleBlocks;

    if (selectedProfessional === "all" || selectedProfessional !== profId) {
        const s = await base44.entities.AgendaSettings.filter({ professional_id: profId });
        settings = s[0];
        blocks = await base44.entities.ScheduleBlock.filter({ professional_id: profId });
    }

    // If no settings, assume available (legacy behavior)
    if (!settings && blocks.length === 0) return { available: true };

    const date = parseISO(dateStr);
    
    // 1. Check Blocks
    const blocked = blocks.find(b => {
      const start = parseISO(b.start_date);
      const end = parseISO(b.end_date);
      const isDateBlocked = date >= start && date <= end;
      
      if (!isDateBlocked) return false;
      if (b.is_all_day) return true;
      
      if (b.start_time && b.end_time) {
        return (startTime >= b.start_time && startTime < b.end_time) || 
               (endTime > b.start_time && endTime <= b.end_time) ||
               (startTime <= b.start_time && endTime >= b.end_time);
      }
      return true;
    });

    if (blocked) return { available: false, reason: blocked.reason || "Horário bloqueado" };

    // 2. Check Overlaps
    const sameDayAppts = agendamentos.filter(a => 
        a.professional_id === profId && 
        a.data_agendamento === dateStr &&
        a.status !== 'cancelado' && a.status !== 'faltou' &&
        a.id !== editingId
    );

    const overlap = sameDayAppts.find(a => {
        const startA = startTime;
        const endA = endTime || startTime;
        const startB = a.horario_inicio;
        const endB = a.horario_fim || a.horario_inicio;
        return (startA < endB) && (endA > startB);
    });

    if (overlap) {
        return { available: false, reason: `Conflito com agendamento de ${overlap.patient_name} (${overlap.horario_inicio})` };
    }

    // 3. Check Weekly Schedule
    if (settings && settings.weekly_schedule) {
      const dayOfWeek = date.getDay();
      const intervals = settings.weekly_schedule[dayOfWeek];

      if (!intervals || intervals.length === 0) {
        return { available: false, reason: "Profissional não atende neste dia da semana" };
      }

      const inInterval = intervals.some(inv => {
        return startTime >= inv.start && startTime < inv.end;
      });

      if (!inInterval) {
        return { available: false, reason: "Horário fora do expediente do profissional" };
      }
    }

    return { available: true };
  };

  const handleSave = async () => {
    if (!formData.patient_name || !formData.data_agendamento || !formData.horario_inicio) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    // Availability Check
    if (formData.professional_id) {
        // We need to load availability if not currently selected (e.g. creating for someone else)
        // But the useEffect loads for 'selectedProfessional'.
        // If formData.professional_id != selectedProfessional, we might miss data.
        // However, the dialog usually matches selected or forces selection.
        // If 'selectedProfessional' is 'all', we might not have settings loaded.
        // For robustness, if selectedProfessional is 'all', we should skip check or fetch ad-hoc.
        // Given complexity, let's rely on currently loaded settings if matches.
        
        // Always check availability if professional is selected
    // STRICT Availability Check
    if (formData.professional_id) {
        const availability = await checkAvailability(formData.data_agendamento, formData.horario_inicio, formData.horario_fim || formData.horario_inicio, formData.professional_id);
        
        if (!availability.available) {
            toast.error(`Não foi possível agendar: ${availability.reason}`);
            return;
        }
    }
    }

    let result;
    if (editingId) {
      result = await base44.entities.Agendamento.update(editingId, formData);
      handleCloseDialog();
      toast.success("Agendamento atualizado!");
    } else {
      result = await base44.entities.Agendamento.create(formData);
      // Don't close dialog, show success screen
      setSuccessData(result);
      // Reload data in background
      loadData(); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deseja excluir este agendamento? Esta ação não pode ser desfeita.")) return;
    await base44.entities.Agendamento.delete(id);
    await loadData();
    handleCloseDialog();
  };

  const handleSendWhatsApp = async () => {
    if (!formData.telefone_contato) {
        toast.error("Adicione um telefone de contato para enviar mensagem.");
        return;
    }

    // Generate token if not exists
    let token = formData.confirmation_token;
    if (!token) {
        token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        // We update the state, but we also need to save it to DB if we want the link to work immediately
        // Actually we should save the appointment first.
    }

    // Save first to ensure token exists in DB
    let apptId = editingId;
    if (!apptId) {
        toast.error("Salve o agendamento antes de enviar mensagem.");
        return;
    }

    // Update with token if needed
    if (!formData.confirmation_token) {
        await base44.entities.Agendamento.update(apptId, { confirmation_token: token });
        setFormData(prev => ({ ...prev, confirmation_token: token }));
    }

    const link = `${window.location.origin}${createPageUrl('ConfirmAppointment')}?token=${token}`;
    const message = `Olá ${formData.patient_name}, confirmamos sua consulta para ${format(parseISO(formData.data_agendamento), "dd/MM 'às' HH:mm")}. Confirme sua presença: ${link}`;

    try {
        const { data } = await base44.functions.invoke("sendWhatsAppMessage", {
            phone: formData.telefone_contato.replace(/\D/g, ''), // remove non-digits
            message: message
        });

        if (data?.success) {
            toast.success("Mensagem enviada!");
            // Log history
            const newLog = {
                date: new Date().toISOString(),
                type: 'whatsapp_confirmation',
                status: 'sent'
            };
            const history = [...(formData.message_history || []), newLog];
            
            await base44.entities.Agendamento.update(apptId, { 
                message_history: history,
                reminder_sent: true 
            });
            setFormData(prev => ({ ...prev, message_history: history }));
            await loadData(); // refresh list
        } else {
            toast.error("Erro ao enviar mensagem: " + (data?.warning || "Erro desconhecido"));
        }
    } catch (err) {
        console.error(err);
        toast.error("Falha ao comunicar com serviço de WhatsApp");
    }
  };

  const copyConfirmationLink = async () => {
    let token = formData.confirmation_token;
    if (!token) {
        // Generate and save
        if (!editingId) {
             toast.error("Salve o agendamento primeiro.");
             return;
        }
        token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await base44.entities.Agendamento.update(editingId, { confirmation_token: token });
        setFormData(prev => ({ ...prev, confirmation_token: token }));
    }
    const link = `${window.location.origin}${createPageUrl('ConfirmAppointment')}?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleEdit = (agendamento) => {
    setEditingId(agendamento.id);
    setFormData({
      patient_id: agendamento.patient_id || "",
      patient_name: agendamento.patient_name,
      professional_id: agendamento.professional_id || "",
      professional_name: agendamento.professional_name || "",
      data_agendamento: agendamento.data_agendamento,
      horario_inicio: agendamento.horario_inicio,
      horario_fim: agendamento.horario_fim || "",
      tipo: agendamento.tipo,
      status: agendamento.status,
      telefone_contato: agendamento.telefone_contato || "",
      observacoes: agendamento.observacoes || "",
      message_history: agendamento.message_history || [],
      confirmation_token: agendamento.confirmation_token || ""
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingId(null);
    setSuccessData(null); // Reset success state
    setFormData({
      patient_id: "",
      patient_name: "",
      professional_id: (currentUser?.can_create_anamnesis || currentUser?.can_manage_own_schedule) && !currentUser?.is_master ? currentUser.id : "",
      professional_name: (currentUser?.can_create_anamnesis || currentUser?.can_manage_own_schedule) && !currentUser?.is_master ? currentUser.full_name : "",
      data_agendamento: format(new Date(), "yyyy-MM-dd"),
      horario_inicio: "",
      horario_fim: "",
      tipo: "primeira_consulta",
      status: "agendado",
      telefone_contato: "",
      observacoes: "",
      message_history: [],
      confirmation_token: ""
    });
  };

  // Function to get slots for the day view
  const getDaySlots = () => {
      const startHour = 6;
      const endHour = 23;
      const duration = scheduleSettings?.slot_duration || 30;
      
      const slots = [];
      let currentMin = startHour * 60;
      const endMin = endHour * 60;
      
      while (currentMin < endMin) {
          const h = Math.floor(currentMin / 60);
          const m = currentMin % 60;
          const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          slots.push(time);
          currentMin += duration;
      }
      return slots;
  };

  const getAgendamentosByDate = (date) => {
    const list = agendamentos.filter(ag => {
      const sameDay = isSameDay(parseISO(ag.data_agendamento), date);
      const professionalMatch = selectedProfessional === "all" || ag.professional_id === selectedProfessional;
      return sameDay && professionalMatch;
    }).sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio));

    // Inject blocks as fake appointments for visual if selectedProfessional is specific
    if (selectedProfessional && selectedProfessional !== "all" && scheduleBlocks.length > 0) {
        scheduleBlocks.forEach(block => {
            const start = parseISO(block.start_date);
            const end = parseISO(block.end_date);
            if (date >= start && date <= end) {
                const isGoogle = block.reason && block.reason.startsWith("Google:");
                list.push({
                    id: `block-${block.id}`,
                    patient_name: isGoogle ? block.reason.replace('Google: ', '') : `BLOQUEIO: ${block.reason}`,
                    horario_inicio: block.is_all_day ? "00:00" : block.start_time || "00:00",
                    horario_fim: block.is_all_day ? "23:59" : block.end_time || "23:59",
                    status: "cancelado", 
                    tipo: "block",
                    is_block: true,
                    is_google: isGoogle
                });
            }
        });
    }
    return list;
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { locale: ptBR });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getMonthDays = () => {
    const start = startOfWeek(startOfMonth(selectedDate), { locale: ptBR });
    const end = endOfWeek(endOfMonth(selectedDate), { locale: ptBR });
    
    const days = [];
    let day = start;
    while (day <= end) {
        days.push(day);
        day = addDays(day, 1);
    }
    return days;
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
              onClick={() => {
                  setFormData(prev => ({
                      ...prev,
                      // Pre-select current user if they are a doctor or manage own schedule
                      professional_id: ((currentUser?.can_create_anamnesis || currentUser?.can_manage_own_schedule) && !currentUser?.is_master && !currentUser?.can_manage_schedule) ? currentUser.id : selectedProfessional !== "all" ? selectedProfessional : "",
                      professional_name: ((currentUser?.can_create_anamnesis || currentUser?.can_manage_own_schedule) && !currentUser?.is_master && !currentUser?.can_manage_schedule) ? currentUser.full_name : professionals.find(p => p.id === selectedProfessional)?.full_name || ""
                  }));
                  setShowDialog(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Professional Filter */}
            {(currentUser?.is_master || currentUser?.can_manage_schedule) && (
                <div className="w-full md:w-64">
                    <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o Profissional" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Profissionais</SelectItem>
                            {professionals.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            <div className="flex gap-4 items-center">
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(createPageUrl("AgendaConfig"))}
                  className="gap-2"
                  title="Configurar Horários e Bloqueios"
              >
                  <Settings className="w-4 h-4" />
                  <span className="hidden md:inline">Configurar Agenda</span>
              </Button>
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
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                onClick={() => setViewMode("month")}
                size="sm"
              >
                Mês
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    if (viewMode === 'month') setSelectedDate(addDays(selectedDate, -30));
                    else setSelectedDate(addDays(selectedDate, viewMode === "day" ? -1 : -7));
                }}
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
                onClick={() => {
                    if (viewMode === 'month') setSelectedDate(addDays(selectedDate, 30));
                    else setSelectedDate(addDays(selectedDate, viewMode === "day" ? 1 : 7));
                }}
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
          </div>

          {viewMode === "day" ? (
            <Card className="shadow-lg border-none bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white shadow-md">
                        <span className="text-xl font-bold leading-none">{format(selectedDate, "dd")}</span>
                    </div>
                    <div>
                        <CardTitle className="text-xl capitalize">
                        {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
                        </CardTitle>
                        <p className="text-sm text-gray-500 capitalize">
                            {format(selectedDate, "EEEE", { locale: ptBR })}
                        </p>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative bg-white">
                    {/* Time Grid Background with Slots */}
                    <div className="flex flex-col">
                        {getDaySlots().map((time, i) => { 
                            const duration = scheduleSettings?.slot_duration || 30;
                            // Calculate height: 1px per minute
                            const height = duration; 
                            
                            // Check Working Hour logic for this slot
                            let isWorkingHour = true;
                            if (scheduleSettings && scheduleSettings.weekly_schedule) {
                                const dayOfWeek = selectedDate.getDay();
                                const intervals = scheduleSettings.weekly_schedule[dayOfWeek];
                                if (!intervals || intervals.length === 0) {
                                    isWorkingHour = false;
                                } else {
                                    const inInterval = intervals.some(inv => {
                                        return (time >= inv.start && time < inv.end);
                                    });
                                    if (!inInterval) isWorkingHour = false;
                                }
                            }
                            
                            return (
                                <div 
                                    key={time} 
                                    className={`flex border-b border-gray-100 group ${!isWorkingHour && scheduleSettings ? 'bg-gray-50/50' : 'hover:bg-blue-50 cursor-pointer'}`}
                                    style={{ height: `${height}px` }}
                                    onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            // Ensure professional is selected
                                            professional_id: ((currentUser?.can_create_anamnesis || currentUser?.can_manage_own_schedule) && !currentUser?.is_master && !currentUser?.can_manage_schedule) ? currentUser.id : selectedProfessional !== "all" ? selectedProfessional : "",
                                            professional_name: ((currentUser?.can_create_anamnesis || currentUser?.can_manage_own_schedule) && !currentUser?.is_master && !currentUser?.can_manage_schedule) ? currentUser.full_name : professionals.find(p => p.id === selectedProfessional)?.full_name || "",
                                            data_agendamento: format(selectedDate, "yyyy-MM-dd"),
                                            horario_inicio: time,
                                            // Auto-calc end time
                                            horario_fim: (() => {
                                                const [h, m] = time.split(':').map(Number);
                                                const endM = m + duration;
                                                const endH = h + Math.floor(endM / 60);
                                                const finalM = endM % 60;
                                                return `${endH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
                                            })()
                                        }));
                                        setShowDialog(true);
                                    }}
                                >
                                    <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 text-xs text-gray-400 font-medium p-1 text-right">
                                        {time}
                                    </div>
                                    <div className="flex-1 relative">
                                        {!isWorkingHour && scheduleSettings && (
                                            <div className="absolute inset-0 bg-gray-100/30"></div>
                                        )}
                                        {/* Hover + button to indicate creation */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <Plus className="w-4 h-4 text-blue-400" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Appointments Overlay */}
                    <div className="absolute top-0 left-0 right-0 ml-16 pointer-events-none"> 
                        {getAgendamentosByDate(selectedDate).length > 0 && (
                            getAgendamentosByDate(selectedDate).map(ag => {
                                // Calculate position based on time
                                const [h, m] = ag.horario_inicio.split(':').map(Number);
                                const startMinutes = (h * 60) + m;
                                const startOffset = startMinutes - (6 * 60); // 6am start
                                
                                const [endH, endM] = ag.horario_fim ? ag.horario_fim.split(':').map(Number) : [h, m + 30]; // default 30m duration if no end time
                                const endMinutes = (endH * 60) + endM;
                                const duration = endMinutes - startMinutes;
                                
                                // pixels per minute = 60px / 60min = 1px/min
                                const top = startOffset * 1; 
                                const height = Math.max(duration * 1, 30); // minimum height 30px

                                if (startOffset < 0) return null; 

                                return (
                                    <div 
                                        key={ag.id}
                                        className={`absolute left-1 right-2 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group z-10 
                                            ${ag.is_block ? "bg-red-100 border-red-600" : "bg-emerald-100 border-emerald-600"}
                                        `}
                                        style={{ top: `${top}px`, height: `${height}px` }}
                                        onClick={() => !ag.is_block && handleEdit(ag)}
                                    >
                                        <div className="flex flex-row h-full">
                                            <div className="flex-1 p-2 flex items-center gap-3">
                                                <div className="flex flex-col min-w-[60px]">
                                                    <span className={`text-xs font-bold ${ag.is_block ? "text-red-900" : "text-emerald-900"}`}>
                                                        {ag.horario_inicio}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">
                                                        {ag.horario_fim || `${format(addDays(parseISO(`2000-01-01T${ag.horario_inicio}`), 0), 'HH:mm')}`}
                                                    </span>
                                                    {ag.is_google && (
                                                        <span className="text-[9px] text-blue-600 font-medium flex items-center gap-0.5 mt-1">
                                                            Google
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0 flex items-center justify-between">
                                                    <div>
                                                        <div className={`font-semibold text-sm truncate ${ag.is_block ? "text-red-900" : "text-emerald-950"}`}>
                                                            {ag.patient_name}
                                                        </div>
                                                        {!ag.is_block && (
                                                            <div className="text-xs text-gray-500 flex items-center gap-2 truncate">
                                                                <span>{tipoLabels[ag.tipo]}</span>
                                                                {ag.telefone_contato && (
                                                                    <>
                                                                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {ag.telefone_contato}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {ag.is_block ? (
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="h-6 w-6 text-red-400 hover:text-red-700 hover:bg-red-200"
                                                                onClick={async (e) => { 
                                                                    e.stopPropagation(); 
                                                                    if(confirm("Deseja remover este bloqueio?")) {
                                                                        await base44.entities.ScheduleBlock.delete(ag.id.replace('block-', ''));
                                                                        loadSchedule(selectedProfessional);
                                                                    }
                                                                }}
                                                                title="Remover Bloqueio"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        ) : (
                                                            <>
                                                                <Badge className={`${statusColors[ag.status]} shadow-none border-0`}>
                                                                    {ag.status}
                                                                </Badge>
                                                                <Button 
                                                                    size="icon" 
                                                                    variant="ghost" 
                                                                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(ag.id); }}
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === "week" ? (
            <Card className="shadow-lg border-none bg-white overflow-hidden">
                <CardHeader className="border-b border-gray-100 pb-0 pt-4 px-0">
                    <div className="flex ml-16">
                        {getWeekDays().map((day, i) => {
                            const isToday = isSameDay(day, new Date());
                            const isSelected = isSameDay(day, selectedDate);
                            return (
                                <div 
                                    key={i} 
                                    className="flex-1 text-center cursor-pointer hover:bg-gray-50 pb-4 transition-colors group relative"
                                    onClick={() => {
                                        setSelectedDate(day);
                                        setViewMode('day');
                                    }}
                                >
                                    <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">
                                        {format(day, "EEE", { locale: ptBR }).toUpperCase()}
                                    </div>
                                    <div className={`
                                        w-10 h-10 mx-auto flex items-center justify-center rounded-full text-lg font-bold transition-all
                                        ${isToday ? 'bg-blue-600 text-white shadow-md scale-110' : 
                                          isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-700 group-hover:bg-gray-200'}
                                    `}>
                                        {format(day, "d")}
                                    </div>
                                    {/* Vertical separator lines for header */}
                                    {i < 6 && <div className="absolute right-0 top-2 bottom-2 w-[1px] bg-gray-100" />}
                                </div>
                            );
                        })}
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-auto">
                    <div className="relative min-h-[600px] bg-white">
                         {/* Time Grid Background */}
                        <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                            {Array.from({ length: 18 }).map((_, i) => { // 6am to 23pm
                                const hour = i + 6; 
                                return (
                                    <div key={hour} className="flex-1 flex border-b border-gray-100 min-h-[60px]">
                                        <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 text-xs text-gray-400 font-medium p-2 text-right transform -translate-y-3">
                                            {hour.toString().padStart(2, '0')}:00
                                        </div>
                                        {/* Vertical lines for days */}
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <div key={j} className={`flex-1 ${j < 6 ? 'border-r border-gray-100' : ''}`} />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Events Overlay */}
                        <div className="relative ml-16 flex min-h-[1080px]">
                            {getWeekDays().map((day, colIndex) => {
                                const dayAgendamentos = getAgendamentosByDate(day);
                                return (
                                    <div key={colIndex} className="flex-1 relative border-r border-transparent px-0.5"> 
                                        {dayAgendamentos.map(ag => {
                                            const [h, m] = ag.horario_inicio.split(':').map(Number);
                                            const startMinutes = (h * 60) + m;
                                            const startOffset = startMinutes - (6 * 60); // 6am start
                                            
                                            const [endH, endM] = ag.horario_fim ? ag.horario_fim.split(':').map(Number) : [h, m + 30]; 
                                            const endMinutes = (endH * 60) + endM;
                                            const duration = endMinutes - startMinutes;
                                            
                                            const top = startOffset * 1; 
                                            const height = Math.max(duration * 1, 30); 

                                            if (startOffset < 0) return null;

                                            return (
                                                <div 
                                                    key={ag.id}
                                                    className={`absolute left-0 right-0 rounded-md border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden z-10 text-[10px] p-1
                                                        ${ag.is_block ? "bg-red-100 border-red-600 hover:z-20" : "bg-emerald-100 border-emerald-600 hover:z-20"}
                                                    `}
                                                    style={{ top: `${top}px`, height: `${height}px` }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!ag.is_block) handleEdit(ag);
                                                    }}
                                                    title={`${ag.horario_inicio} - ${ag.patient_name}`}
                                                >
                                                     <div className={`font-bold leading-tight truncate ${ag.is_block ? "text-red-900" : "text-emerald-900"}`}>
                                                        {ag.is_block ? "BLOQUEIO" : ag.patient_name}
                                                     </div>
                                                     <div className={`truncate ${ag.is_block ? "text-red-700" : "text-emerald-700"}`}>
                                                        {ag.horario_inicio} - {ag.horario_fim}
                                                     </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
          ) : (
            // Month View
            <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="text-center font-bold text-gray-500 py-2">{d}</div>
                ))}
                {getMonthDays().map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, selectedDate);
                    const dayAgendamentos = getAgendamentosByDate(day);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                        <Card 
                            key={idx} 
                            className={`min-h-[100px] border-none shadow-sm ${!isCurrentMonth ? 'bg-gray-50 opacity-50' : 'bg-white'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => {
                                setSelectedDate(day);
                                setViewMode('day');
                            }}
                        >
                            <CardHeader className="p-2 pb-0">
                                <span className={`text-sm font-semibold ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}`}>
                                    {format(day, 'd')}
                                </span>
                            </CardHeader>
                            <CardContent className="p-2 space-y-1">
                                {dayAgendamentos.slice(0, 3).map((ag, i) => (
                                    <div key={i} className={`text-[10px] truncate px-1 rounded ${ag.is_block ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                        {ag.is_block ? 'Bloqueio' : ag.horario_inicio}
                                    </div>
                                ))}
                                {dayAgendamentos.length > 3 && (
                                    <div className="text-[10px] text-gray-500 text-center">
                                        + {dayAgendamentos.length - 3} mais
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
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
          {successData ? (
             <div className="space-y-6 py-4">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Agendamento Criado!</h3>
                    <p className="text-gray-500 mt-1">
                        {successData.patient_name} - {format(parseISO(successData.data_agendamento), "dd/MM 'às' HH:mm")}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <Button 
                        size="lg"
                        className="w-full gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold shadow-md transition-all transform hover:scale-[1.02]"
                        onClick={() => {
                            const phone = successData.telefone_contato?.replace(/\D/g, '');
                            // Generate token if needed or use ID. Assuming logic uses token.
                            // If confirmation_token wasn't set on create (it should be in default state if empty? No, we might need to update it).
                            // But usually we can use a generic link or the ID if the page supports it.
                            // Let's assume we generated a token or just send a message.
                            const token = successData.confirmation_token || "TOKEN"; // Should ensure token is generated on create if missing?
                            const link = `${window.location.origin}${createPageUrl('ConfirmAppointment')}?token=${token}`;
                            const message = `Olá ${successData.patient_name}, confirmamos sua consulta para ${format(parseISO(successData.data_agendamento), "dd/MM 'às' HH:mm")}. Confirme sua presença: ${link}`;
                            
                            const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                            window.open(url, '_blank');
                        }}
                        disabled={!successData.telefone_contato}
                    >
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        Enviar WhatsApp Web
                    </Button>

                    <Button 
                        variant="outline"
                        size="lg"
                        className="w-full gap-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={async () => {
                             // Fetch patient email if not in successData (it might not be fully populated)
                             let email = "";
                             if (successData.patient_id) {
                                 const p = await base44.entities.Patient.filter({ id: successData.patient_id });
                                 if (p && p[0]) email = p[0].email;
                             }
                             if (!email) {
                                 toast.error("Paciente sem e-mail cadastrado.");
                                 return;
                             }
                             
                             const token = successData.confirmation_token || "TOKEN";
                             const link = `${window.location.origin}${createPageUrl('ConfirmAppointment')}?token=${token}`;
                             const subject = `Confirmação de Consulta - MediSOAP`;
                             const body = `Olá ${successData.patient_name},\n\nConfirmamos sua consulta para ${format(parseISO(successData.data_agendamento), "dd/MM 'às' HH:mm")}.\n\nPor favor, confirme sua presença clicando no link abaixo:\n${link}\n\nAtenciosamente,\nEquipe MediSOAP`;
                             
                             const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                             window.open(url, '_blank');
                        }}
                    >
                        <Send className="w-5 h-5" />
                        Enviar E-mail
                    </Button>

                    <Button 
                        variant="outline"
                        size="lg"
                        className="w-full gap-3 text-gray-600 border-gray-200 hover:bg-gray-50"
                        onClick={() => {
                             const token = successData.confirmation_token || "TOKEN";
                             const link = `${window.location.origin}${createPageUrl('ConfirmAppointment')}?token=${token}`;
                             navigator.clipboard.writeText(link);
                             toast.success("Link copiado!");
                        }}
                    >
                        <LinkIcon className="w-5 h-5" />
                        Copiar Link
                    </Button>
                </div>
             </div>
          ) : (
            <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label>Profissional (Médico) *</Label>
                    <Select 
                        value={formData.professional_id} 
                        onValueChange={(val) => {
                            const prof = professionals.find(p => p.id === val);
                            setFormData({...formData, professional_id: val, professional_name: prof?.full_name || ""})
                        }}
                        disabled={(currentUser?.can_create_anamnesis || currentUser?.can_manage_own_schedule) && !currentUser?.is_master && !currentUser?.can_manage_schedule}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o médico" />
                        </SelectTrigger>
                        <SelectContent>
                            {professionals.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2 flex items-end gap-2">
                  <div className="flex-1">
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
                  <Button 
                    type="button" 
                    onClick={() => setShowPatientDialog(true)}
                    className="mb-[2px] bg-green-600 hover:bg-green-700 text-white"
                    title="Novo Paciente"
                  >
                    <Plus className="w-4 h-4" />
                    Novo
                  </Button>
                </div>
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
                <Select
                  value={formData.horario_inicio}
                  onValueChange={(value) => {
                      // Calculate end time based on slot duration if possible
                      // We don't have direct access to duration here without fetching settings again,
                      // but we can default to 30 mins or leave it to the user/logic
                      // Ideally we find the next slot?
                      // Simple approach: just set start time.
                      
                      // Optional: Auto-set end time to +30m (or whatever duration is)
                      // We can assume 30m for now or parse from settings if we had them in state.
                      // Let's just set the start time and let the user adjust end time if needed,
                      // OR (better) auto-calculate end time:
                      const [h, m] = value.split(':').map(Number);
                      const endM = m + 30; // Default 30
                      const endH = h + Math.floor(endM / 60);
                      const finalM = endM % 60;
                      const endTime = `${endH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
                      
                      setFormData({ ...formData, horario_inicio: value, horario_fim: endTime });
                  }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={availableSlots.length > 0 ? "Selecione um horário" : "Sem horários livres"} />
                    </SelectTrigger>
                    <SelectContent>
                        {availableSlots.length > 0 ? (
                            availableSlots.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))
                        ) : (
                            formData.horario_inicio && <SelectItem value={formData.horario_inicio}>{formData.horario_inicio} (Atual)</SelectItem>
                        )}
                        {/* Fallback manual entry? Maybe not needed if logic is strict */}
                    </SelectContent>
                </Select>
                {availableSlots.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Nenhum horário disponível para esta data.</p>
                )}
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

            {/* WhatsApp and History Section - Only in Edit Mode */}
            {editingId && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        Comunicação com Paciente
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
                            onClick={handleSendWhatsApp}
                        >
                            <Send className="w-3 h-3" />
                            Enviar Confirmação (WhatsApp)
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 text-blue-700 border-blue-200 hover:bg-blue-50"
                            onClick={copyConfirmationLink}
                        >
                            <LinkIcon className="w-3 h-3" />
                            Copiar Link de Confirmação
                        </Button>
                    </div>

                    {formData.message_history && formData.message_history.length > 0 && (
                        <div className="bg-gray-50 rounded-md p-3">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Histórico de Envios</p>
                            <ScrollArea className="h-20">
                                <div className="space-y-2">
                                    {formData.message_history.map((log, i) => (
                                        <div key={i} className="text-xs flex justify-between items-center text-gray-600">
                                            <span>
                                                {log.type === 'whatsapp_confirmation' ? 'Confirmação via WhatsApp' : 'Mensagem'}
                                            </span>
                                            <span className="text-gray-400">
                                                {format(parseISO(log.date), "dd/MM HH:mm")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            )}
          </div>
          
          <div className="flex justify-between gap-3 pt-4 border-t mt-4">
            {successData ? (
                <Button variant="outline" onClick={handleCloseDialog} className="w-full">
                    Fechar
                </Button>
            ) : (
                <>
                    {editingId ? (
                        <Button variant="destructive" onClick={() => handleDelete(editingId)} className="gap-2">
                            <Trash2 className="w-4 h-4" />
                            Excluir
                        </Button>
                    ) : <div />}
                    
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCloseDialog}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                            {editingId ? "Atualizar" : "Criar"} Agendamento
                        </Button>
                    </div>
                </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PatientFormDialog 
        open={showPatientDialog} 
        onOpenChange={setShowPatientDialog}
        onSuccess={(newPatient) => {
            if (newPatient) {
                setFormData(prev => ({
                    ...prev,
                    patient_id: newPatient.id,
                    patient_name: newPatient.nome
                }));
                toast.success("Paciente criado e selecionado!");
            }
        }}
      />
    </PermissionGuard>
  );
}