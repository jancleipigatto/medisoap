import React, { useState, useEffect } from "react";
import { Anamnesis } from "@/entities/Anamnesis";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileText, Search, Calendar, User as UserIcon, ArrowLeft, Copy as CopyIcon, Trash2, FileCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import PermissionGuard from "../components/PermissionGuard";
import { useNavigate } from "react-router-dom";

export default function History() {
  const navigate = useNavigate();
  const [anamneses, setAnamneses] = useState([]);
  const [filteredAnamneses, setFilteredAnamneses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = anamneses;
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.avaliacao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (!showCancelled) {
      filtered = filtered.filter(a => !a.is_cancelled);
    }
    
    setFilteredAnamneses(filtered);
  }, [searchTerm, anamneses, showCancelled]);

  const generateAttendanceNumber = (date, existingAnamneses) => {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const dateStr = `${day}${month}${year}`;
    
    const sameDay = existingAnamneses.filter(a => {
      if (!a.numero_atendimento) return false;
      return a.numero_atendimento.endsWith(dateStr);
    });
    
    const nextNumber = sameDay.length + 1;
    return `${nextNumber}_${dateStr}`;
  };

  const loadData = async () => {
    setIsLoading(true);
    const user = await User.me();
    setCurrentUser(user);
    
    let data = await Anamnesis.list("-data_consulta", 50);
    
    // Filtrar apenas anamneses não deletadas
    let activeAnamneses = data.filter(a => !a.is_deleted);

    // Filter confidential records
    activeAnamneses = activeAnamneses.filter(a => {
      if (a.is_confidential) {
        const isCreator = (a.creator_id && a.creator_id === user.id) || (a.created_by === user.email);
        return isCreator || user.is_master; // Only creator or master can see confidential records
      }
      return true;
    });
    
    // Gerar números de atendimento para anamneses que não têm
    const needsUpdate = activeAnamneses.some(a => !a.numero_atendimento);
    
    if (needsUpdate) {
      const sortedByDate = [...activeAnamneses].sort((a, b) => 
        new Date(a.data_consulta) - new Date(b.data_consulta)
      );
      
      for (const anamnesis of sortedByDate) {
        if (!anamnesis.numero_atendimento) {
          const numero = generateAttendanceNumber(anamnesis.data_consulta, data);
          await Anamnesis.update(anamnesis.id, {
            numero_atendimento: numero
          });
        }
      }
      
      // Recarregar dados atualizados
      data = await Anamnesis.list("-data_consulta", 50);
      activeAnamneses = data.filter(a => !a.is_deleted);
    }
    
    // Filtrar por usuário - apenas vê suas próprias anamneses, exceto se tiver permissão de ver todas
    if (user.can_view_all_anamnesis) {
      setAnamneses(activeAnamneses);
      setFilteredAnamneses(activeAnamneses);
    } else {
      const myAnamneses = activeAnamneses.filter(a => a.created_by === user.email);
      setAnamneses(myAnamneses);
      setFilteredAnamneses(myAnamneses);
    }
    
    setIsLoading(false);
  };

  const handleCancel = async (anamnesis) => {
    if (!confirm("Deseja cancelar este atendimento? O número do atendimento será inutilizado.")) {
      return;
    }

    await Anamnesis.update(anamnesis.id, {
      is_cancelled: true,
      cancelled_at: new Date().toISOString()
    });

    loadData();
  };

  return (
    <PermissionGuard permission="can_create_anamnesis">
      <div className="p-4 md:p-8">
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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Histórico de Consultas</h1>
              <p className="text-gray-600 mt-1">Visualize suas consultas anteriores</p>
            </div>
            <Link to={createPageUrl("NewAnamnesis")}>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                Novo atendimento
              </Button>
            </Link>
          </div>

          <Card className="mb-6 shadow-md border-none">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por paciente ou diagnóstico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Switch
                  id="show-cancelled"
                  checked={showCancelled}
                  onCheckedChange={setShowCancelled}
                />
                <Label htmlFor="show-cancelled" className="cursor-pointer">Mostrar cancelados</Label>
              </div>
            </CardContent>
          </Card>

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
            ) : filteredAnamneses.length === 0 ? (
              <Card className="shadow-md border-none">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? "Nenhuma anamnese encontrada" : "Nenhuma anamnese registrada"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? "Tente buscar por outro termo" : "Comece criando sua primeira anamnese"}
                  </p>
                  {!searchTerm && (
                    <Link to={createPageUrl("NewAnamnesis")}>
                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        Meu primeiro atendimento 
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredAnamneses.map((anamnesis) => (
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
                              <CardTitle 
                                className={`text-xl hover:text-blue-600 cursor-pointer transition-colors ${anamnesis.is_cancelled ? 'text-gray-400' : ''}`}
                                onClick={() => navigate(createPageUrl(`PatientHistory?patientId=${anamnesis.patient_id}`))}
                              >
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
                              {format(parseISO(anamnesis.data_consulta), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
                              {(anamnesis.subjetivo || anamnesis.objetivo || anamnesis.avaliacao || anamnesis.plano) && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => navigate(createPageUrl("AnamnesisDetail") + "?id=" + anamnesis.id)}
                                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Abrir Atendimento
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(createPageUrl("AnamnesisDetail") + "?id=" + anamnesis.id + "&tab=documentos")}
                                    className="gap-2"
                                  >
                                    <FileCheck className="w-4 h-4" />
                                    Ver Documentos
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
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
                                    }}
                                    className="gap-2"
                                  >
                                    <CopyIcon className="w-4 h-4" />
                                    Copiar
                                  </Button>
                                </>
                              )}
                              {!(anamnesis.subjetivo || anamnesis.objetivo || anamnesis.avaliacao || anamnesis.plano) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(createPageUrl(`NewAnamnesis?continue=${anamnesis.id}`))}
                                    className="gap-2"
                                  >
                                    <CopyIcon className="w-4 h-4" />
                                    Continuar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancel(anamnesis)}
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
                      {anamnesis.avaliacao && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">Avaliação:</p>
                          <p className="text-gray-600 line-clamp-2">{anamnesis.avaliacao}</p>
                        </div>
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