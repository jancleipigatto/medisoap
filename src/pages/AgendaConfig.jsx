import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PermissionGuard from "@/components/PermissionGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, CalendarX, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WeeklyScheduleEditor from "@/components/agenda/WeeklyScheduleEditor";
import BlockManager from "@/components/agenda/BlockManager";
import IntegrationsSettings from "@/components/agenda/IntegrationsSettings";
import { Share2 } from "lucide-react";

export default function AgendaConfig() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const navigate = useNavigate();

  return (
    <PermissionGuard permission={["can_manage_schedule", "can_manage_own_schedule"]}>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Agenda"))}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuração de Agenda</h1>
            <p className="text-muted-foreground mt-2">
              Defina seus horários de atendimento recorrentes e gerencie bloqueios de agenda.
            </p>
          </div>
        </div>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
            <TabsTrigger value="schedule">
              <Settings className="w-4 h-4 mr-2" />
              Horário Semanal
            </TabsTrigger>
            <TabsTrigger value="blocks">
              <CalendarX className="w-4 h-4 mr-2" />
              Bloqueios
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Share2 className="w-4 h-4 mr-2" />
              Integrações
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

          <TabsContent value="integrations" className="mt-6">
             <IntegrationsSettings user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}