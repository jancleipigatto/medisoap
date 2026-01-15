
import React, { useState, useEffect } from "react";
import { Anamnesis } from "@/entities/Anamnesis";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw, Calendar, User as UserIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PermissionGuard from "../components/PermissionGuard";

export default function Trash() {
  const [anamneses, setAnamneses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [restoreConfirm, setRestoreConfirm] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const user = await User.me();
    setCurrentUser(user);
    
    const data = await Anamnesis.list("-deleted_at", 100);
    
    // Filtrar apenas deletadas
    let deletedAnamneses = data.filter(a => a.is_deleted);
    
    // Excluir definitivamente as que passaram de 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const anamnesis of deletedAnamneses) {
      if (anamnesis.deleted_at) {
        const deletedDate = new Date(anamnesis.deleted_at);
        if (deletedDate < thirtyDaysAgo) {
          await Anamnesis.delete(anamnesis.id);
        }
      }
    }
    
    // Recarregar após limpeza
    const updatedData = await Anamnesis.list("-deleted_at", 100);
    deletedAnamneses = updatedData.filter(a => a.is_deleted);
    
    // Filtrar por usuário - apenas vê suas próprias anamneses deletadas, exceto se tiver permissão
    if (user.can_view_all_anamnesis) {
      setAnamneses(deletedAnamneses);
    } else {
      const myAnamneses = deletedAnamneses.filter(a => a.created_by === user.email);
      setAnamneses(myAnamneses);
    }
    
    setIsLoading(false);
  };

  const handleRestore = async (anamnesis) => {
    await Anamnesis.update(anamnesis.id, {
      is_deleted: false,
      deleted_at: null,
      deletion_reason: null
    });
    setRestoreConfirm(null);
    loadData();
  };

  const handleDeletePermanently = async (anamnesis) => {
    await Anamnesis.delete(anamnesis.id);
    setDeleteConfirm(null);
    loadData();
  };

  const getDaysInTrash = (deletedAt) => {
    if (!deletedAt) return 0;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.abs(now - deleted);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysRemaining = (deletedAt) => {
    return 30 - getDaysInTrash(deletedAt);
  };

  return (
    <PermissionGuard permission="can_create_anamnesis">
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lixeira</h1>
              <p className="text-gray-600 mt-1">Anamneses excluídas - Serão deletadas definitivamente após 30 dias</p>
            </div>
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
                  <Trash2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Lixeira vazia</h3>
                  <p className="text-gray-500">Nenhuma anamnese excluída</p>
                </CardContent>
              </Card>
            ) : (
              anamneses.map((anamnesis) => {
                const daysRemaining = getDaysRemaining(anamnesis.deleted_at);
                return (
                  <Card key={anamnesis.id} className="shadow-md border-none hover:shadow-xl transition-shadow duration-200 border-l-4 border-l-red-400">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{anamnesis.patient_name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              Consulta: {format(new Date(anamnesis.data_consulta), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-red-600">
                              <Trash2 className="w-4 h-4" />
                              Excluída: {format(new Date(anamnesis.deleted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRestoreConfirm(anamnesis)}
                            className="gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restaurar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm(anamnesis)}
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {anamnesis.deletion_reason && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <p className="text-sm font-medium text-red-700 mb-1">Motivo da exclusão:</p>
                          <p className="text-sm text-gray-700">{anamnesis.deletion_reason}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge className={`${daysRemaining <= 7 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'} para exclusão definitiva
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <AlertDialog open={!!restoreConfirm} onOpenChange={() => setRestoreConfirm(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restaurar Anamnese</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja restaurar a anamnese de <strong>{restoreConfirm?.patient_name}</strong>? 
                  Ela voltará para a lista principal de anamneses.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleRestore(restoreConfirm)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Restaurar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Excluir Definitivamente
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é <strong>irreversível</strong>! A anamnese de <strong>{deleteConfirm?.patient_name}</strong> será 
                  excluída permanentemente e não poderá ser recuperada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleDeletePermanently(deleteConfirm)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Excluir Definitivamente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </PermissionGuard>
  );
}
