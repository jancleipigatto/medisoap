import React, { useState, useEffect } from "react";
import { Anamnesis } from "@/entities/Anamnesis";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Calendar, User as UserIcon, ArrowLeft, PlayCircle } from "lucide-react";
import { format } from "date-fns";
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
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = anamneses.filter(a => 
        a.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.avaliacao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAnamneses(filtered);
    } else {
      setFilteredAnamneses(anamneses);
    }
  }, [searchTerm, anamneses]);

  const loadData = async () => {
    setIsLoading(true);
    const user = await User.me();
    setCurrentUser(user);
    
    const data = await Anamnesis.list("-data_consulta", 50);
    
    // Filtrar apenas anamneses não deletadas
    const activeAnamneses = data.filter(a => !a.is_deleted);
    
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
              <h1 className="text-3xl font-bold text-gray-900">Histórico de Anamneses</h1>
              <p className="text-gray-600 mt-1">Visualize suas consultas anteriores</p>
            </div>
            <Link to={createPageUrl("NewAnamnesis")}>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                Nova Anamnese
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
                        Criar Anamnese
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredAnamneses.map((anamnesis) => (
                <Card key={anamnesis.id} className="shadow-md border-none hover:shadow-xl transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Link 
                          to={createPageUrl(`AnamnesisDetail?id=${anamnesis.id}`)}
                          className="flex items-start gap-3 flex-1"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{anamnesis.patient_name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(anamnesis.data_consulta), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                          </div>
                        </Link>
                        <div className="flex gap-2">
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            SOAP
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(createPageUrl(`NewAnamnesis?continue=${anamnesis.id}`))}
                            className="gap-2"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Continuar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Link to={createPageUrl(`AnamnesisDetail?id=${anamnesis.id}`)}>
                        {anamnesis.avaliacao && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-700 mb-1">Avaliação:</p>
                            <p className="text-gray-600 line-clamp-2">{anamnesis.avaliacao}</p>
                          </div>
                        )}
                      </Link>
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