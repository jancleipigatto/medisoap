import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Activity, Thermometer, Weight, Ruler, Search, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PatientSelector from "../anamnesis/PatientSelector";
import { format, isSameDay, parseISO } from "date-fns";

const PatientQueueList = ({ onSelect }) => {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQueue = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const allAgendamentos = await base44.entities.Agendamento.list("-horario_inicio");
        const filtered = allAgendamentos.filter(ag => 
          isSameDay(parseISO(ag.data_agendamento), today) && 
          (ag.status === 'recepcionado' || ag.status === 'aguardando_triagem')
        );
        setQueue(filtered.sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio)));
      } catch (error) {
        console.error("Erro ao carregar fila:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadQueue();
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <p className="text-sm text-gray-500">Carregando fila...</p>;
  if (queue.length === 0) return <p className="text-sm text-gray-500">Nenhum paciente aguardando triagem no momento.</p>;

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Horário</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Profissional</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queue.map((ag) => (
            <TableRow key={ag.id}>
              <TableCell className="font-medium">{ag.horario_inicio}</TableCell>
              <TableCell className="font-medium">{ag.patient_name}</TableCell>
              <TableCell className="text-gray-600">{ag.professional_name || "N/A"}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {ag.status === 'recepcionado' ? 'Aguardando Triagem' : ag.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  size="sm" 
                  onClick={() => onSelect({ id: ag.patient_id, nome: ag.patient_name }, ag.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Realizar Triagem
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default function TriagemContent() {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isListMode, setIsListMode] = useState(true);
  const [currentAgendamentoId, setCurrentAgendamentoId] = useState(null);
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
  const [triagem, setTriagem] = useState({
    pa: "",
    temperatura: "",
    peso: "",
    altura: "",
    spo2: "",
    fc: "",
    fr: "",
    hgt: "",
    hgt_tipo: "",
    queixa: "",
    observacoes: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUser();
    checkContinueTriagem();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
  };

  const checkContinueTriagem = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const anamnesisId = urlParams.get('anamnesisId');
    
    if (anamnesisId) {
      const anamneses = await base44.entities.Anamnesis.list();
      const anamnesis = anamneses.find(a => a.id === anamnesisId);
      
      if (anamnesis) {
        setSelectedPatient({ id: anamnesis.patient_id, nome: anamnesis.patient_name });
        setDataConsulta(anamnesis.data_consulta);
        setHorarioConsulta(anamnesis.horario_consulta || horarioConsulta);
        setTriagem({
          pa: anamnesis.triagem_pa || "",
          temperatura: anamnesis.triagem_temperatura || "",
          peso: anamnesis.triagem_peso || "",
          altura: anamnesis.triagem_altura || "",
          spo2: anamnesis.triagem_spo2 || "",
          fc: anamnesis.triagem_fc || "",
          fr: anamnesis.triagem_fr || "",
          hgt: anamnesis.triagem_hgt || "",
          hgt_tipo: anamnesis.triagem_hgt_tipo || "",
          queixa: anamnesis.triagem_queixa || "",
          observacoes: anamnesis.triagem_observacoes || ""
        });
        setIsListMode(false);
      }
    }
  };

  const generateAttendanceNumber = async (date) => {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const dateStr = `${day}${month}${year}`;
    
    const allAnamneses = await base44.entities.Anamnesis.list();
    const sameDay = allAnamneses.filter(a => {
      if (!a.numero_atendimento) return false;
      return a.numero_atendimento.endsWith(dateStr);
    });
    
    const nextNumber = sameDay.length + 1;
    return `${nextNumber}_${dateStr}`;
  };

  const handleSave = async () => {
    if (!selectedPatient) {
      alert("Por favor, selecione um paciente");
      return;
    }

    if (!triagem.pa && !triagem.temperatura && !triagem.peso && !triagem.altura && !triagem.queixa) {
      alert("Por favor, preencha ao menos um campo da triagem");
      return;
    }

    setIsSaving(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const anamnesisId = urlParams.get('anamnesisId');
      
      const triagemData = {
        triagem_pa: triagem.pa,
        triagem_temperatura: triagem.temperatura,
        triagem_peso: triagem.peso,
        triagem_altura: triagem.altura,
        triagem_spo2: triagem.spo2,
        triagem_fc: triagem.fc,
        triagem_fr: triagem.fr,
        triagem_hgt: triagem.hgt,
        triagem_hgt_tipo: triagem.hgt_tipo,
        triagem_queixa: triagem.queixa,
        triagem_observacoes: triagem.observacoes,
        triagem_realizada_por: currentUser?.full_name || "Não identificado",
        triagem_data_hora: new Date().toISOString()
      };

      if (anamnesisId) {
        // Atualizar anamnese existente
        await base44.entities.Anamnesis.update(anamnesisId, triagemData);
        alert("Triagem atualizada com sucesso!");
      } else {
        // Criar nova anamnese com triagem
        
        // Atualizar status do agendamento se existir, ou criar um novo se não existir
        let appointmentIdToLink = currentAgendamentoId;

        if (currentAgendamentoId) {
          try {
            await base44.entities.Agendamento.update(currentAgendamentoId, { status: "aguardando_atendimento" });
          } catch (e) {
            console.error("Erro ao atualizar status do agendamento", e);
          }
        } else {
          try {
            // Criar agendamento automático para aparecer na fila de consulta
            const newApp = await base44.entities.Agendamento.create({
              patient_id: selectedPatient.id,
              patient_name: selectedPatient.nome,
              data_agendamento: dataConsulta,
              horario_inicio: horarioConsulta,
              horario_fim: horarioConsulta, // Estimativa
              status: "aguardando_atendimento",
              tipo: "primeira_consulta",
              observacoes: "Não recepcionado"
            });
            appointmentIdToLink = newApp.id;
          } catch (e) {
            console.error("Erro ao criar agendamento automático pós-triagem", e);
          }
        }

        const numeroAtendimento = await generateAttendanceNumber(dataConsulta);
        await base44.entities.Anamnesis.create({
          patient_id: selectedPatient.id,
          patient_name: selectedPatient.nome,
          appointment_id: appointmentIdToLink,
          data_consulta: dataConsulta,
          horario_consulta: horarioConsulta,
          numero_atendimento: numeroAtendimento,
          ...triagemData,
          texto_original: "",
          subjetivo: "",
          objetivo: "",
          avaliacao: "",
          plano: ""
        });

        alert("Triagem registrada com sucesso!");
      }

      // Limpar formulário e voltar para lista
      setSelectedPatient(null);
      setCurrentAgendamentoId(null);
      setTriagem({
        pa: "",
        temperatura: "",
        peso: "",
        altura: "",
        spo2: "",
        fc: "",
        fr: "",
        hgt: "",
        hgt_tipo: "",
        queixa: "",
        observacoes: ""
      });
      
      setIsListMode(true);
    } catch (error) {
      console.error("Erro ao salvar triagem:", error);
      alert("Erro ao salvar triagem: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isListMode) {
    return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
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
                <Activity className="w-8 h-8 text-blue-600" />
                Triagem
              </h1>
              <p className="text-gray-600 mt-1">Gerencie a fila de triagem</p>
            </div>
          </div>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Pacientes Aguardando Triagem</CardTitle>
            </CardHeader>
            <CardContent>
              <PatientQueueList onSelect={(patient, agendamentoId) => {
                setSelectedPatient(patient);
                setCurrentAgendamentoId(agendamentoId);
                setIsListMode(false);
              }} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSelectedPatient(null);
              setIsListMode(true);
            }}
            className="shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-7 h-7 text-blue-600" />
              Realizar Triagem
            </h1>
            <p className="text-sm text-gray-600 mt-1">Registre os sinais vitais e queixa principal</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-base">Informações do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                 <Label className="text-xs text-gray-500 uppercase font-bold tracking-wide">Paciente</Label>
                 <p className="text-lg font-medium text-gray-900">{selectedPatient?.nome}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data" className="text-sm">Data</Label>
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
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                Sinais Vitais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pa" className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Pressão Arterial
                  </Label>
                  <Input
                    id="pa"
                    placeholder="Ex: 120/80 mmHg"
                    value={triagem.pa}
                    onChange={(e) => setTriagem({...triagem, pa: e.target.value})}
                    className="text-sm h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="temperatura" className="text-sm flex items-center gap-2">
                    <Thermometer className="w-4 h-4" />
                    Temperatura
                  </Label>
                  <Input
                    id="temperatura"
                    placeholder="Ex: 36.5°C"
                    value={triagem.temperatura}
                    onChange={(e) => setTriagem({...triagem, temperatura: e.target.value})}
                    className="text-sm h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="peso" className="text-sm flex items-center gap-2">
                    <Weight className="w-4 h-4" />
                    Peso
                  </Label>
                  <Input
                    id="peso"
                    placeholder="Ex: 70 kg"
                    value={triagem.peso}
                    onChange={(e) => setTriagem({...triagem, peso: e.target.value})}
                    className="text-sm h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="altura" className="text-sm flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Altura
                  </Label>
                  <Input
                    id="altura"
                    placeholder="Ex: 170 cm"
                    value={triagem.altura}
                    onChange={(e) => setTriagem({...triagem, altura: e.target.value})}
                    className="text-sm h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spo2" className="text-sm flex items-center gap-2">
                    Sp02%
                  </Label>
                  <Input
                    id="spo2"
                    placeholder="Ex: 98%"
                    value={triagem.spo2}
                    onChange={(e) => setTriagem({...triagem, spo2: e.target.value})}
                    className="text-sm h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="fc" className="text-sm flex items-center gap-2">
                    Fc (BPM)
                  </Label>
                  <Input
                    id="fc"
                    placeholder="Ex: 80 bpm"
                    value={triagem.fc}
                    onChange={(e) => setTriagem({...triagem, fc: e.target.value})}
                    className="text-sm h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fr" className="text-sm flex items-center gap-2">
                    Fr (IRPM)
                  </Label>
                  <Input
                    id="fr"
                    placeholder="Ex: 18 irpm"
                    value={triagem.fr}
                    onChange={(e) => setTriagem({...triagem, fr: e.target.value})}
                    className="text-sm h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="hgt" className="text-sm flex items-center gap-2">
                    Hgt (mg/dL)
                  </Label>
                  <div className="space-y-2">
                    <Input
                      id="hgt"
                      placeholder="Ex: 90 mg/dL"
                      value={triagem.hgt}
                      onChange={(e) => setTriagem({...triagem, hgt: e.target.value})}
                      className="text-sm h-9"
                    />
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="hgt_tipo"
                          value="pos_prandial"
                          checked={triagem.hgt_tipo === 'pos_prandial'}
                          onChange={(e) => setTriagem({...triagem, hgt_tipo: e.target.value})}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700">Pós-prandial</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="hgt_tipo"
                          value="jejum"
                          checked={triagem.hgt_tipo === 'jejum'}
                          onChange={(e) => setTriagem({...triagem, hgt_tipo: e.target.value})}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700">Jejum</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-base">Queixa e Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="queixa" className="text-sm">Queixa Principal do Dia</Label>
                <Textarea
                  id="queixa"
                  placeholder="Ex: Dor de cabeça há 2 dias, febre desde ontem..."
                  value={triagem.queixa}
                  onChange={(e) => setTriagem({...triagem, queixa: e.target.value})}
                  className="min-h-[100px] text-sm"
                />
              </div>
              <div>
                <Label htmlFor="observacoes" className="text-sm">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações relevantes sobre o estado geral do paciente..."
                  value={triagem.observacoes}
                  onChange={(e) => setTriagem({...triagem, observacoes: e.target.value})}
                  className="min-h-[80px] text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={isSaving || !selectedPatient}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-10"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Triagem"}
          </Button>
        </div>
      </div>
    </div>
  );
}