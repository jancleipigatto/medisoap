import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, User as UserIcon, ArrowLeft, Copy as CopyIcon, Eye, EyeOff, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import PermissionGuard from "../components/PermissionGuard";

export default function PatientHistory() {
  const navigate = useNavigate();
  const [anamneses, setAnamneses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [showFullAnamnesis, setShowFullAnamnesis] = useState(false);

  useEffect(() => {
    loadPatientHistory();
  }, []);

  const generateAttendanceNumber = (date, existingAnamneses) => {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const dateStr = `${day}${month}${year}`;
    
    // Contar atendimentos do mesmo dia
    const sameDay = existingAnamneses.filter(a => {
      if (!a.numero_atendimento) return false;
      return a.numero_atendimento.endsWith(dateStr);
    });
    
    const nextNumber = sameDay.length + 1;
    return `${nextNumber}_${dateStr}`;
  };

  const loadPatientHistory = async () => {
    setIsLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    
    if (!patientId) {
      navigate(createPageUrl("Patients"));
      return;
    }

    const allAnamneses = await base44.entities.Anamnesis.list("-data_consulta");
    let patientAnamneses = allAnamneses.filter(a => 
      a.patient_id === patientId && !a.is_deleted
    );
    
    // Gerar números de atendimento para anamneses que não têm
    const needsUpdate = patientAnamneses.some(a => !a.numero_atendimento);
    
    if (needsUpdate) {
      const sortedByDate = [...patientAnamneses].sort((a, b) => 
        new Date(a.data_consulta) - new Date(b.data_consulta)
      );
      
      for (const anamnesis of sortedByDate) {
        if (!anamnesis.numero_atendimento) {
          const numero = generateAttendanceNumber(anamnesis.data_consulta, allAnamneses);
          await base44.entities.Anamnesis.update(anamnesis.id, {
            numero_atendimento: numero
          });
        }
      }
      
      // Recarregar dados atualizados
      const updatedAnamneses = await base44.entities.Anamnesis.list("-data_consulta");
      patientAnamneses = updatedAnamneses.filter(a => 
        a.patient_id === patientId && !a.is_deleted
      );
    }
    
    if (patientAnamneses.length > 0) {
      setPatientName(patientAnamneses[0].patient_name);
    }
    
    setAnamneses(patientAnamneses);
    setIsLoading(false);
  };

  const handleCancel = async (anamnesis) => {
    if (!confirm("Deseja cancelar este atendimento? O número do atendimento será inutilizado.")) {
      return;
    }

    await base44.entities.Anamnesis.update(anamnesis.id, {
      is_cancelled: true,
      cancelled_at: new Date().toISOString()
    });

    loadPatientHistory();
  };

  const handleContinue = (anamnesis) => {
    navigate(createPageUrl(`NewAnamnesis?continue=${anamnesis.id}`));
  };

  const handleCopy = (anamnesis) => {
    const soapText = `ANAMNESE - FORMATO SOAP

S - SUBJETIVO:
${anamnesis.subjetivo || "Não informado"}

O - OBJETIVO:
${anamnesis.objetivo || "Não informado"}

A - AVALIAÇÃO:
${anamnesis.avaliacao || "Não informado"}

P - PLANO:
${anamnesis.plano || "Não informado"}`;
    navigate(createPageUrl(`NewAnamnesis?copyText=${encodeURIComponent(soapText)}`));
  };

  return (
    <PermissionGuard permission="can_create_anamnesis">
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Patients"))}
              className="shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Histórico do Paciente</h1>
              <p className="text-gray-600 mt-1">{patientName || "Carregando..."}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFullAnamnesis(!showFullAnamnesis)}
              className="gap-2"
            >
              {showFullAnamnesis ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Mostrar Apenas Resumo (S)
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Mostrar Anamnese Completa
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="shadow-md border-none">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))
            ) : anamneses.length === 0 ? (
              <Card className="shadow-md border-none">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhuma anamnese registrada
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Este paciente ainda não possui consultas registradas
                  </p>
                </CardContent>
              </Card>
            ) : (
              anamneses.map((anamnesis) => (
                <Card 
                  key={anamnesis.id} 
                  className={`shadow-md border-none hover:shadow-xl transition-shadow duration-200 ${
                    anamnesis.is_cancelled ? 'opacity-50 relative' : ''
                  }`}
                >
                  {anamnesis.is_cancelled && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-full border-t-2 border-dashed border-gray-400" />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 bg-gradient-to-br ${anamnesis.is_cancelled ? 'from-gray-100 to-gray-200' : 'from-blue-100 to-indigo-100'} rounded-full flex items-center justify-center`}>
                          <UserIcon className={`w-5 h-5 ${anamnesis.is_cancelled ? 'text-gray-400' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className={`text-xl ${anamnesis.is_cancelled ? 'text-gray-400' : ''}`}>
                              {anamnesis.patient_name}
                            </CardTitle>
                            {anamnesis.numero_atendimento && (
                              <Badge variant="outline" className={anamnesis.is_cancelled ? 'bg-gray-100 text-gray-400 border-gray-300' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                                Nº {anamnesis.numero_atendimento}
                              </Badge>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 mt-1 text-sm ${anamnesis.is_cancelled ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Calendar className="w-4 h-4" />
                            {format(new Date(anamnesis.data_consulta), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {anamnesis.is_cancelled ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            CANCELADO
                          </Badge>
                        ) : (
                          <>
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              SOAP
                            </Badge>
                            {(anamnesis.subjetivo || anamnesis.objetivo || anamnesis.avaliacao || anamnesis.plano) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(anamnesis);
                                }}
                                className="gap-2"
                              >
                                <CopyIcon className="w-4 h-4" />
                                Copiar
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleContinue(anamnesis);
                                  }}
                                  className="gap-2"
                                >
                                  <CopyIcon className="w-4 h-4" />
                                  Continuar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancel(anamnesis);
                                  }}
                                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showFullAnamnesis ? (
                      <div className="space-y-4">
                        {anamnesis.subjetivo && (
                          <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-green-700 mb-2">S - Subjetivo:</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{anamnesis.subjetivo}</p>
                          </div>
                        )}
                        {anamnesis.objetivo && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-blue-700 mb-2">O - Objetivo:</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{anamnesis.objetivo}</p>
                          </div>
                        )}
                        {anamnesis.avaliacao && (
                          <div className="bg-purple-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-purple-700 mb-2">A - Avaliação:</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{anamnesis.avaliacao}</p>
                          </div>
                        )}
                        {anamnesis.plano && (
                          <div className="bg-orange-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-orange-700 mb-2">P - Plano:</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{anamnesis.plano}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      anamnesis.subjetivo && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm font-semibold text-green-700 mb-2">S - Subjetivo (Resumo):</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{anamnesis.subjetivo}</p>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}