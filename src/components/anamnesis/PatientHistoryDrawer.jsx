import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar, Eye, EyeOff, Copy, Check, Activity, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// Remove HTML tags and decode entities
function stripHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

const VITAL_OPTIONS = [
  { key: "pa",   label: "Pressão Arterial (PA)",       lines: [{ dataKey: "pas", name: "PAS", stroke: "#ef4444" }, { dataKey: "pad", name: "PAD", stroke: "#f97316" }], domain: [40, 220] },
  { key: "fc",   label: "Frequência Cardíaca (FC)",    lines: [{ dataKey: "fc",  name: "FC",  stroke: "#3b82f6" }], domain: [30, 200] },
  { key: "fr",   label: "Frequência Respiratória (FR)",lines: [{ dataKey: "fr",  name: "FR",  stroke: "#06b6d4" }], domain: [0, 50]  },
  { key: "spo2", label: "SpO2 (%)",                    lines: [{ dataKey: "spo2",name: "SpO2",stroke: "#10b981" }], domain: [80, 100]},
  { key: "temp", label: "Temperatura (°C)",            lines: [{ dataKey: "temp",name: "Temp",stroke: "#f59e0b" }], domain: [34, 42] },
  { key: "peso", label: "Peso (kg)",                   lines: [{ dataKey: "peso",name: "Peso",stroke: "#8b5cf6" }], domain: undefined},
  { key: "altura",label: "Altura (cm)",               lines: [{ dataKey: "altura",name: "Altura",stroke: "#64748b" }], domain: undefined},
  { key: "hgt",  label: "HGT / Glicemia (mg/dL)",     lines: [{ dataKey: "hgt", name: "HGT", stroke: "#ec4899" }], domain: [0, 500] },
];

function VitalChart({ anamneses }) {
  const allData = anamneses
    .map(a => {
      const entry = { date: format(new Date(a.data_consulta), "dd/MM/yy", { locale: ptBR }) };
      if (a.triagem_pa) {
        const parts = a.triagem_pa.replace(/\s*(mmhg|mmHg)/i, "").split(/[x\/]/);
        if (parts.length >= 2) { entry.pas = parseInt(parts[0]); entry.pad = parseInt(parts[1]); }
      }
      if (a.triagem_fc) entry.fc = parseInt(a.triagem_fc);
      if (a.triagem_fr) entry.fr = parseInt(a.triagem_fr);
      if (a.triagem_spo2) entry.spo2 = parseFloat(a.triagem_spo2);
      if (a.triagem_temperatura) entry.temp = parseFloat(a.triagem_temperatura);
      if (a.triagem_peso) entry.peso = parseFloat(a.triagem_peso);
      if (a.triagem_altura) entry.altura = parseFloat(a.triagem_altura);
      if (a.triagem_hgt) entry.hgt = parseFloat(a.triagem_hgt);
      return entry;
    })
    .reverse();

  // Only show options that have at least one data point
  const availableOptions = VITAL_OPTIONS.filter(opt =>
    opt.lines.some(l => allData.some(d => d[l.dataKey] != null))
  );

  const [selectedKey, setSelectedKey] = React.useState(null);

  // Auto-select first available on load
  const activeKey = selectedKey || availableOptions[0]?.key;
  const activeOption = VITAL_OPTIONS.find(o => o.key === activeKey);

  if (availableOptions.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Nenhum dado de triagem registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <select
        value={activeKey}
        onChange={e => setSelectedKey(e.target.value)}
        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {availableOptions.map(opt => (
          <option key={opt.key} value={opt.key}>{opt.label}</option>
        ))}
      </select>

      {activeOption && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">{activeOption.label}</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={allData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={activeOption.domain} tick={{ fontSize: 11 }} />
              <Tooltip />
              {activeOption.lines.length > 1 && <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />}
              {activeOption.lines.map(l => (
                <Line key={l.dataKey} type="monotone" dataKey={l.dataKey} name={l.name} stroke={l.stroke} strokeWidth={2} dot={{ r: 4 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TriagemBadges({ a }) {
  const items = [
    { label: "PA", value: a.triagem_pa, unit: "mmHg" },
    { label: "FC", value: a.triagem_fc, unit: "bpm" },
    { label: "Temp", value: a.triagem_temperatura, unit: "°C" },
    { label: "SpO2", value: a.triagem_spo2, unit: "%" },
    { label: "Peso", value: a.triagem_peso, unit: "kg" },
    { label: "Altura", value: a.triagem_altura, unit: "cm" },
  ].filter(i => i.value);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map(i => (
        <span key={i.label} className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded px-2 py-0.5 font-medium">
          {i.label}: {i.value} {i.unit}
        </span>
      ))}
    </div>
  );
}

function CopyButton({ anamnesis }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const parts = [];
    if (anamnesis.subjetivo) parts.push(`S - SUBJETIVO:\n${stripHtml(anamnesis.subjetivo)}`);
    if (anamnesis.objetivo) parts.push(`O - OBJETIVO:\n${stripHtml(anamnesis.objetivo)}`);
    if (anamnesis.avaliacao) parts.push(`A - AVALIAÇÃO:\n${stripHtml(anamnesis.avaliacao)}`);
    if (anamnesis.plano) parts.push(`P - PLANO:\n${stripHtml(anamnesis.plano)}`);
    if (!parts.length && anamnesis.texto_original) parts.push(stripHtml(anamnesis.texto_original));
    navigator.clipboard.writeText(parts.join("\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2 text-xs gap-1 text-gray-500 hover:text-blue-600">
      {copied ? <><Check className="w-3 h-3 text-green-500" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
    </Button>
  );
}

export default function PatientHistoryDrawer({ open, onOpenChange, patient }) {
  const [anamneses, setAnamneses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    if (open && patient?.id) {
      loadHistory();
    }
  }, [open, patient?.id]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const all = await base44.entities.Anamnesis.filter({ patient_id: patient.id }, "-data_consulta", 50);
      setAnamneses(all.filter(a => !a.is_cancelled));
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold">
              Histórico — {patient?.nome}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFull(!showFull)}
              className="text-xs gap-1 text-gray-500"
            >
              {showFull ? <><EyeOff className="w-3 h-3" /> Resumo</> : <><Eye className="w-3 h-3" /> Completo</>}
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="consultas" className="w-full">
            <TabsList className="w-full rounded-none border-b h-10 px-6 bg-white justify-start gap-2">
              <TabsTrigger value="consultas" className="text-xs gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Consultas
              </TabsTrigger>
              <TabsTrigger value="graficos" className="text-xs gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Gráficos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="consultas" className="px-6 py-4 space-y-4 mt-0">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2 border rounded-lg p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))
              ) : anamneses.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhum atendimento registrado</p>
                </div>
              ) : (
                anamneses.map((a) => (
                  <div key={a.id} className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
                    {/* Header row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-medium">
                          {format(new Date(a.data_consulta), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        {a.horario_consulta && <span className="text-gray-400">· {a.horario_consulta}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {a.numero_atendimento && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Nº {a.numero_atendimento}
                          </Badge>
                        )}
                        <CopyButton anamnesis={a} />
                      </div>
                    </div>

                    {/* Triagem badges */}
                    <TriagemBadges a={a} />

                    {/* Content */}
                    {showFull ? (
                      <div className="space-y-2 text-sm">
                        {a.subjetivo && (
                          <div className="bg-green-50 rounded p-3">
                            <p className="font-semibold text-green-700 text-xs mb-1">S - Subjetivo</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{stripHtml(a.subjetivo)}</p>
                          </div>
                        )}
                        {a.objetivo && (
                          <div className="bg-blue-50 rounded p-3">
                            <p className="font-semibold text-blue-700 text-xs mb-1">O - Objetivo</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{stripHtml(a.objetivo)}</p>
                          </div>
                        )}
                        {a.avaliacao && (
                          <div className="bg-purple-50 rounded p-3">
                            <p className="font-semibold text-purple-700 text-xs mb-1">A - Avaliação</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{stripHtml(a.avaliacao)}</p>
                          </div>
                        )}
                        {a.plano && (
                          <div className="bg-orange-50 rounded p-3">
                            <p className="font-semibold text-orange-700 text-xs mb-1">P - Plano</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{stripHtml(a.plano)}</p>
                          </div>
                        )}
                        {a.texto_original && !a.subjetivo && (
                          <div className="bg-gray-50 rounded p-3">
                            <p className="font-semibold text-gray-600 text-xs mb-1">Texto do Atendimento</p>
                            <p className="text-gray-700 whitespace-pre-wrap text-xs">{stripHtml(a.texto_original)}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      a.subjetivo ? (
                        <div className="bg-green-50 rounded p-3 text-sm">
                          <p className="font-semibold text-green-700 text-xs mb-1">S - Subjetivo</p>
                          <p className="text-gray-700 line-clamp-3 whitespace-pre-wrap">{stripHtml(a.subjetivo)}</p>
                        </div>
                      ) : a.texto_original ? (
                        <div className="bg-gray-50 rounded p-3 text-sm">
                          <p className="font-semibold text-gray-600 text-xs mb-1">Atendimento</p>
                          <p className="text-gray-700 line-clamp-3 whitespace-pre-wrap text-xs">{stripHtml(a.texto_original)}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Sem conteúdo registrado</p>
                      )
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="graficos" className="px-6 py-4 mt-0">
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <VitalChart anamneses={anamneses} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}