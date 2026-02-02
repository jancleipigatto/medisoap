import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PermissionGuard from "@/components/PermissionGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, CalendarX } from "lucide-react";
import WeeklyScheduleEditor from "@/components/agenda/WeeklyScheduleEditor";
import BlockManager from "@/components/agenda/BlockManager";

export default function AgendaConfig() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  return (
    <PermissionGuard permission="can_manage_schedule">
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuração de Agenda</h1>
          <p className="text-muted-foreground mt-2">
            Defina seus horários de atendimento recorrentes e gerencie bloqueios de agenda.
          </p>
        </div>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="schedule">
              <Settings className="w-4 h-4 mr-2" />
              Horário Semanal
            </TabsTrigger>
            <TabsTrigger value="blocks">
              <CalendarX className="w-4 h-4 mr-2" />
              Bloqueios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Horário de Atendimento Semanal</CardTitle>
                <CardDescription>
                  Configure os dias e horários que você atende regularmente. 
                  Horários fora destes intervalos aparecerão como bloqueados para a recepção.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeeklyScheduleEditor user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bloqueios e Exceções</CardTitle>
                <CardDescription>
                  Adicione períodos de férias, feriados ou indisponibilidades pontuais.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BlockManager user={user} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}