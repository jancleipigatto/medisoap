import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
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

        <div className="px-6 py-4 space-y-4">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-medium">
                      {format(new Date(a.data_consulta), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    {a.horario_consulta && <span className="text-gray-400">· {a.horario_consulta}</span>}
                  </div>
                  {a.numero_atendimento && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Nº {a.numero_atendimento}
                    </Badge>
                  )}
                </div>

                {showFull ? (
                  <div className="space-y-2 text-sm">
                    {a.subjetivo && (
                      <div className="bg-green-50 rounded p-3">
                        <p className="font-semibold text-green-700 text-xs mb-1">S - Subjetivo</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{a.subjetivo}</p>
                      </div>
                    )}
                    {a.objetivo && (
                      <div className="bg-blue-50 rounded p-3">
                        <p className="font-semibold text-blue-700 text-xs mb-1">O - Objetivo</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{a.objetivo}</p>
                      </div>
                    )}
                    {a.avaliacao && (
                      <div className="bg-purple-50 rounded p-3">
                        <p className="font-semibold text-purple-700 text-xs mb-1">A - Avaliação</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{a.avaliacao}</p>
                      </div>
                    )}
                    {a.plano && (
                      <div className="bg-orange-50 rounded p-3">
                        <p className="font-semibold text-orange-700 text-xs mb-1">P - Plano</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{a.plano}</p>
                      </div>
                    )}
                    {a.texto_original && !a.subjetivo && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="font-semibold text-gray-600 text-xs mb-1">Texto do Atendimento</p>
                        <p className="text-gray-700 whitespace-pre-wrap text-xs">{a.texto_original}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  a.subjetivo ? (
                    <div className="bg-green-50 rounded p-3 text-sm">
                      <p className="font-semibold text-green-700 text-xs mb-1">S - Subjetivo</p>
                      <p className="text-gray-700 line-clamp-3 whitespace-pre-wrap">{a.subjetivo}</p>
                    </div>
                  ) : a.texto_original ? (
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <p className="font-semibold text-gray-600 text-xs mb-1">Atendimento</p>
                      <p className="text-gray-700 line-clamp-3 whitespace-pre-wrap text-xs">{a.texto_original}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Sem conteúdo registrado</p>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}