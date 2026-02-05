import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
// CalendarDateRangePicker import removed
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { Activity, DollarSign, Users, AlertTriangle, Calendar, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, differenceInMinutes, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import PermissionGuard from "@/components/PermissionGuard";

// Simple Date Range Picker implementation since we might not have one in ui/
function MonthPicker({ value, onChange }) {
  const months = [
    { value: "0", label: "Janeiro" }, { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" }, { value: "3", label: "Abril" },
    { value: "4", label: "Maio" }, { value: "5", label: "Junho" },
    { value: "6", label: "Julho" }, { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" }, { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" }, { value: "11", label: "Dezembro" }
  ];
  
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="flex gap-2">
      <Select value={value.month.toString()} onValueChange={(v) => onChange({...value, month: parseInt(v)})}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.year.toString()} onValueChange={(v) => onChange({...value, year: parseInt(v)})}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function DashboardAnalytics() {
  const [dateRange, setDateRange] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  
  // Fetch data
  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(new Date(dateRange.year, dateRange.month));
      const end = endOfMonth(new Date(dateRange.year, dateRange.month));
      
      // Fetch Appointments
      // Note: In a real app with many records, we'd use backend filtering.
      // Here we simulate by fetching and filtering in JS for the demo or simple usage.
      // Ideally base44 supports filtering by date range.
      // Assuming list returns recent 500 or so. If not enough, we need pagination.
      // Let's assume we can filter by 'data_agendamento' string (YYYY-MM-DD).
      
      // Filter params
      // Since base44.entities.list accepts filters, but simple equality. Range queries might need backend function.
      // We'll fetch all/limit and filter in memory for this "Senior Architect" MVP demo.
      const appointments = await base44.entities.Agendamento.list(null, 500); 
      const financials = await base44.entities.FinancialRecord.list(null, 500);
      const anamneses = await base44.entities.Anamnesis.list(null, 500);

      // Filter by date range
      const filteredAppointments = appointments.filter(a => {
        const d = new Date(a.data_agendamento);
        return d >= start && d <= end;
      });

      const filteredFinancials = financials.filter(f => {
        const d = new Date(f.transaction_date);
        return d >= start && d <= end;
      });
      
      const filteredAnamneses = anamneses.filter(a => {
        const d = new Date(a.data_consulta);
        return d >= start && d <= end;
      });

      calculateMetrics(filteredAppointments, filteredFinancials, filteredAnamneses);

    } catch (error) {
      console.error("Error loading analytics:", error);
    }
    setLoading(false);
  };

  const calculateMetrics = (appointments, financials, anamneses) => {
    // 1. Operational & Schedule Analytics
    const totalAppointments = appointments.length;
    const completed = appointments.filter(a => a.status === 'realizado' || a.status === 'finalizado').length;
    const noShows = appointments.filter(a => a.status === 'faltou').length;
    const canceled = appointments.filter(a => a.status === 'cancelado').length;
    
    // Occupancy Rate (Simplification: Total / (Total + Available?? We don't have available slots directly))
    // Alternative: We can calculate based on working hours if we knew them. 
    // Proxy: Occupancy = (Completed + NoShow) / (Total Scheduled Slots)
    // If we assume the schedule was full if not for gaps, but we don't know gaps.
    // Let's use: Occupancy = (Appointments / Potential Capacity).
    // Hard to guess capacity.
    // Let's just show No-Show Rate.
    const noShowRate = totalAppointments > 0 ? (noShows / totalAppointments) * 100 : 0;

    // Wait Time Analysis
    // Diff between horario_inicio (scheduled) and anamnesis.created_date (actual start)
    // We need to link appointment to anamnesis
    let totalWaitMinutes = 0;
    let waitCount = 0;
    
    appointments.forEach(app => {
        if (app.status === 'realizado') {
            const anamnesis = anamneses.find(a => a.appointment_id === app.id);
            if (anamnesis && app.horario_inicio && anamnesis.created_date) {
                // Parse times
                // app.data_agendamento + app.horario_inicio
                // anamnesis.created_date (is ISO)
                try {
                    const scheduled = parseISO(`${app.data_agendamento}T${app.horario_inicio}`);
                    const started = parseISO(anamnesis.created_date); // or created_date from system
                    const diff = differenceInMinutes(started, scheduled);
                    if (diff > -60 && diff < 300) { // Filter outliers
                        totalWaitMinutes += diff;
                        waitCount++;
                    }
                } catch (e) {}
            }
        }
    });
    const avgWaitTime = waitCount > 0 ? (totalWaitMinutes / waitCount).toFixed(0) : 0;


    // 2. Financial Performance
    const totalRevenue = filteredFinancials.reduce((acc, curr) => acc + (curr.amount_received || 0), 0);
    const totalBilled = filteredFinancials.reduce((acc, curr) => acc + (curr.amount_billed || 0), 0);
    
    // Insurance Denial Rate
    const insuranceRecords = filteredFinancials.filter(f => f.payment_method === 'convenio');
    const deniedRecords = insuranceRecords.filter(f => f.insurance_status === 'negado');
    const denialRate = insuranceRecords.length > 0 ? (deniedRecords.length / insuranceRecords.length) * 100 : 0;

    // Ticket Size (Average per patient)
    const uniquePatients = new Set(filteredFinancials.map(f => f.patient_id)).size;
    const ticketSize = uniquePatients > 0 ? totalRevenue / uniquePatients : 0;

    // 3. Medical Record Auditing (Ghost Records)
    // Appointments 'realizado' but no anamnesis OR anamnesis empty
    const ghostRecords = appointments.filter(app => {
        if (app.status !== 'realizado') return false;
        const anamnesis = anamneses.find(a => a.appointment_id === app.id);
        if (!anamnesis) return true; // No record
        // Check if empty (simplified check)
        if (!anamnesis.subjetivo && !anamnesis.objetivo && !anamnesis.texto_original) return true;
        return false;
    });

    // Epidemiology Heatmap (Top CIDs)
    const cidCounts = {};
    anamneses.forEach(a => {
        if (a.cids && Array.isArray(a.cids)) {
            a.cids.forEach(cid => {
                cidCounts[cid] = (cidCounts[cid] || 0) + 1;
            });
        }
    });
    const topCids = Object.entries(cidCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));


    setMetrics({
        operational: {
            total: totalAppointments,
            completed,
            noShows,
            canceled,
            noShowRate: noShowRate.toFixed(1),
            avgWaitTime
        },
        financial: {
            revenue: totalRevenue,
            billed: totalBilled,
            denialRate: denialRate.toFixed(1),
            ticketSize: ticketSize.toFixed(2)
        },
        auditing: {
            ghostCount: ghostRecords.length,
            ghostRecords, // Limit display?
            topCids
        }
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <PermissionGuard permission="is_master">
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Painel de Inteligência Gerencial</h1>
                <p className="text-gray-500">Monitoramento de performance, financeiro e compliance.</p>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                <MonthPicker value={dateRange} onChange={setDateRange} />
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Activity className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        ) : metrics ? (
            <Tabs defaultValue="operational" className="space-y-6">
                <TabsList className="bg-white p-1 shadow-sm border border-gray-200">
                    <TabsTrigger value="operational" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                        <Activity className="w-4 h-4 mr-2" /> Operacional
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
                        <DollarSign className="w-4 h-4 mr-2" /> Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="auditing" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
                        <AlertTriangle className="w-4 h-4 mr-2" /> Auditoria & Compliance
                    </TabsTrigger>
                </TabsList>

                {/* OPERATIONAL TAB */}
                <TabsContent value="operational" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Taxa de No-Show</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metrics.operational.noShowRate}%</div>
                                <p className="text-xs text-gray-500">Agendamentos perdidos</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Tempo Médio de Espera</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metrics.operational.avgWaitTime} min</div>
                                <p className="text-xs text-gray-500">Diferença Agendado vs Realizado</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Total Agendamentos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metrics.operational.total}</div>
                                <div className="flex text-xs text-gray-500 gap-2 mt-1">
                                    <span className="text-green-600">{metrics.operational.completed} Realizados</span>
                                    <span className="text-red-600">{metrics.operational.canceled} Cancelados</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="h-[300px]">
                            <CardHeader>
                                <CardTitle>Status dos Agendamentos</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Realizado', value: metrics.operational.completed },
                                                { name: 'Faltou', value: metrics.operational.noShows },
                                                { name: 'Cancelado', value: metrics.operational.canceled }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {['#22c55e', '#ef4444', '#9ca3af'].map((color, index) => (
                                                <Cell key={`cell-${index}`} fill={color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* FINANCIAL TAB */}
                <TabsContent value="financial" className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Receita Total</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    R$ {metrics.financial.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-gray-500">Valor recebido no período</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Ticket Médio</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    R$ {metrics.financial.ticketSize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-gray-500">Por paciente único</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Taxa de Glosa (Convênios)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{metrics.financial.denialRate}%</div>
                                <p className="text-xs text-gray-500">Faturas negadas</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* AUDITING TAB */}
                <TabsContent value="auditing" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="w-5 h-5" />
                                    "Ghost Records" (Prontuários Fantasmas)
                                </CardTitle>
                                <CardDescription>
                                    Atendimentos marcados como realizados sem registro clínico correspondente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-4">{metrics.auditing.ghostCount}</div>
                                {metrics.auditing.ghostRecords.length > 0 && (
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {metrics.auditing.ghostRecords.map(rec => (
                                            <div key={rec.id} className="text-sm p-2 bg-red-50 rounded border border-red-100 flex justify-between">
                                                <span>{rec.patient_name}</span>
                                                <span className="text-gray-500">{format(new Date(rec.data_agendamento), 'dd/MM/yyyy')} {rec.horario_inicio}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Mapa de Calor Epidemiológico (Top CIDs)</CardTitle>
                                <CardDescription>Diagnósticos mais frequentes no período</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics.auditing.topCids} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#8884d8" name="Ocorrências" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        ) : null}
      </div>
    </PermissionGuard>
  );
}