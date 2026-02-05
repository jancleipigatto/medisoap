import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DAYS = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Segunda-feira" },
  { id: 2, label: "Terça-feira" },
  { id: 3, label: "Quarta-feira" },
  { id: 4, label: "Quinta-feira" },
  { id: 5, label: "Sexta-feira" },
  { id: 6, label: "Sábado" },
];

export default function WeeklyScheduleEditor({ user }) {
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [slotDuration, setSlotDuration] = useState(30);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    try {
      const settings = await base44.entities.AgendaSettings.filter({
        professional_id: user.id
      });

      if (settings.length > 0) {
        setSettingsId(settings[0].id);
        setSchedule(settings[0].weekly_schedule || {});
        setSlotDuration(settings[0].slot_duration || 30);
      } else {
        // Initialize with empty schedule
        setSchedule({});
      }
    } catch (error) {
      console.error("Error loading schedule settings:", error);
      toast.error("Erro ao carregar configurações de agenda");
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayId) => {
    const newSchedule = { ...schedule };
    if (newSchedule[dayId]) {
      delete newSchedule[dayId];
    } else {
      newSchedule[dayId] = [{ start: "08:00", end: "18:00" }];
    }
    setSchedule(newSchedule);
  };

  const addInterval = (dayId) => {
    const newSchedule = { ...schedule };
    if (!newSchedule[dayId]) newSchedule[dayId] = [];
    newSchedule[dayId].push({ start: "09:00", end: "12:00", type: "all" });
    setSchedule(newSchedule);
  };

  const removeInterval = (dayId, index) => {
    const newSchedule = { ...schedule };
    newSchedule[dayId].splice(index, 1);
    if (newSchedule[dayId].length === 0) {
      delete newSchedule[dayId]; // Disable day if no intervals? Or keep enabled with 0 intervals?
      // Better to keep day key but empty array if user wants. But toggle logic removes key.
      // Let's stick to: key exists = day enabled.
    }
    setSchedule(newSchedule);
  };

  const updateInterval = (dayId, index, field, value) => {
    const newSchedule = { ...schedule };
    newSchedule[dayId][index][field] = value;
    setSchedule(newSchedule);
  };

  const replicateSchedule = (sourceDayId, target) => {
    const sourceIntervals = schedule[sourceDayId];
    if (!sourceIntervals) return;

    const newSchedule = { ...schedule };
    // 1-5 for weekdays, 0-6 for all
    const targets = target === 'weekdays' ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];

    targets.forEach(dayId => {
      if (dayId === sourceDayId) return;
      // Enable the day if it wasn't
      // Deep copy intervals to avoid reference issues
      newSchedule[dayId] = sourceIntervals.map(i => ({ ...i }));
    });

    setSchedule(newSchedule);
    toast.success(target === 'weekdays' ? "Replicado para dias úteis!" : "Replicado para todos os dias!");
  };

  const handleSaveClick = () => {
    setShowConfirmDialog(true);
  };

  const confirmSave = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    try {
      const data = {
        professional_id: user.id,
        slot_duration: parseInt(slotDuration),
        weekly_schedule: schedule,
        active: true
      };

      if (settingsId) {
        await base44.entities.AgendaSettings.update(settingsId, data);
      } else {
        const newSetting = await base44.entities.AgendaSettings.create(data);
        setSettingsId(newSetting.id);
      }
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !schedule) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Label>Duração do Atendimento (minutos)</Label>
            <Input 
              type="number" 
              className="w-24" 
              value={slotDuration} 
              onChange={(e) => setSlotDuration(e.target.value)} 
            />
          </div>

          <div className="space-y-4">
            {DAYS.map((day) => {
              const isEnabled = !!schedule[day.id];
              return (
                <div key={day.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={isEnabled} 
                        onCheckedChange={() => handleDayToggle(day.id)} 
                      />
                      <span className="font-medium text-lg">{day.label}</span>
                    </div>
                    {isEnabled && (
                      <div className="flex gap-2">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Copy className="w-4 h-4 mr-2" /> Replicar
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => replicateSchedule(day.id, 'weekdays')}>
                              Para Dias Úteis (Seg-Sex)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => replicateSchedule(day.id, 'all')}>
                              Para Todos os Dias
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" size="sm" onClick={() => addInterval(day.id)}>
                          <Plus className="w-4 h-4 mr-2" /> Adicionar Período
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEnabled && (
                    <div className="space-y-3 pl-12">
                      {schedule[day.id]?.map((interval, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Input 
                            type="time" 
                            className="w-32" 
                            value={interval.start} 
                            onChange={(e) => updateInterval(day.id, index, 'start', e.target.value)} 
                          />
                          <span>até</span>
                          <Input 
                            type="time" 
                            className="w-32" 
                            value={interval.end} 
                            onChange={(e) => updateInterval(day.id, index, 'end', e.target.value)} 
                          />
                          <div className="w-40">
                            <Select 
                              value={interval.type || "all"} 
                              onValueChange={(val) => updateInterval(day.id, index, 'type', val)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Qualquer</SelectItem>
                                <SelectItem value="sus">SUS</SelectItem>
                                <SelectItem value="convenio">Convênio</SelectItem>
                                <SelectItem value="particular">Particular</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeInterval(day.id, index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {(!schedule[day.id] || schedule[day.id].length === 0) && (
                        <p className="text-sm text-gray-500 italic">Nenhum horário configurado para este dia (dia bloqueado)</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveClick} disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Horários</DialogTitle>
            <DialogDescription>
              Verifique o espelho dos horários configurados antes de salvar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="text-sm font-medium text-gray-500 mb-2">Duração do slot: {slotDuration} min</div>
            
            {DAYS.map(day => {
               const intervals = schedule[day.id];
               if (!intervals || intervals.length === 0) return null;
               
               return (
                 <div key={day.id} className="border-b border-gray-100 pb-2 last:border-0">
                    <div className="font-semibold text-gray-900 mb-1">{day.label}</div>
                    <div className="space-y-1">
                      {intervals.map((int, i) => (
                        <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                           {int.start} até {int.end} 
                           {int.type && int.type !== 'all' && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded uppercase">{int.type}</span>}
                        </div>
                      ))}
                    </div>
                 </div>
               )
            })}
            
            {Object.keys(schedule).length === 0 && (
                <div className="text-center text-gray-500 py-4 italic">Nenhum horário configurado.</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Voltar e Editar
            </Button>
            <Button onClick={confirmSave} className="bg-green-600 hover:bg-green-700 text-white">
              <Check className="w-4 h-4 mr-2" />
              Confirmar e Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}