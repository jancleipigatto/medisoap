import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';
import ical from 'npm:ical-generator@8.0.0';

Deno.serve(async (req) => {
    try {
        const url = new URL(req.url);
        const token = url.searchParams.get("token");

        if (!token) {
            return new Response("Token não fornecido", { status: 401 });
        }

        const base44 = createClientFromRequest(req);
        
        // Usar Service Role pois o acesso é público (via token)
        const settingsList = await base44.asServiceRole.entities.AgendaSettings.filter({ 
            ical_token: token,
            ical_enabled: true 
        });

        if (!settingsList || settingsList.length === 0) {
            return new Response("Calendário não encontrado ou desativado", { status: 404 });
        }

        const settings = settingsList[0];
        const professional = await base44.asServiceRole.entities.User.get(settings.professional_id);

        if (!professional) {
             return new Response("Profissional não encontrado", { status: 404 });
        }

        // Buscar agendamentos futuros e recentes (ex: últimos 30 dias e próximos 6 meses)
        // Como não temos filtro complexo de data no filter simples, vamos pegar os mais recentes e filtrar na memória se necessário,
        // ou confiar na ordenação. O ideal é filtrar por data, mas o SDK pode não suportar operators complexos no filter simples.
        // Vamos pegar os últimos 200 agendamentos ordenados por data.
        
        // TODO: Melhorar filtro para data >= hoje - 30 dias se possível.
        // Por enquanto, listamos um bom número.
        const appointments = await base44.asServiceRole.entities.Agendamento.filter(
            { professional_id: settings.professional_id }, 
            "-data_agendamento", 
            500
        );

        const calendar = ical({
            name: `Agenda - ${professional.full_name || 'MediSOAP'}`,
            timezone: 'America/Sao_Paulo'
        });

        appointments.forEach(app => {
            if (app.status === 'cancelado') return;

            // Construir data inicio e fim
            // data_agendamento é YYYY-MM-DD string
            // horario_inicio é HH:mm string
            const startStr = `${app.data_agendamento}T${app.horario_inicio}:00`;
            const endStr = app.horario_fim ? `${app.data_agendamento}T${app.horario_fim}:00` : null;
            
            const start = new Date(startStr);
            let end = endStr ? new Date(endStr) : null;
            
            if (!end) {
                // Default 30 min se não tiver fim
                end = new Date(start.getTime() + 30 * 60000);
            }

            calendar.createEvent({
                start: start,
                end: end,
                summary: `Consulta: ${app.patient_name}`,
                description: `Tipo: ${app.tipo}\nStatus: ${app.status}\nObs: ${app.observacoes || '-'}`,
                location: professional.endereco_rua ? `${professional.endereco_rua}, ${professional.endereco_numero}` : 'Consultório',
                id: app.id,
                url: `https://medisoap.app/Consulta` // Placeholder
            });
        });
        
        // Adicionar bloqueios também? Seria bom.
        const blocks = await base44.asServiceRole.entities.ScheduleBlock.filter({ professional_id: settings.professional_id });
        
        blocks.forEach(block => {
             const startStr = `${block.start_date}T${block.start_time || '00:00'}:00`;
             const endStr = `${block.end_date}T${block.end_time || '23:59'}:00`;
             
             calendar.createEvent({
                start: new Date(startStr),
                end: new Date(endStr),
                summary: `BLOQUEIO: ${block.reason}`,
                allDay: block.is_all_day,
                transparency: 'OPAQUE' // OPAQUE means busy
             });
        });

        return new Response(calendar.toString(), {
            status: 200,
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Content-Disposition": `attachment; filename="agenda_${professional.id}.ics"`
            }
        });

    } catch (error) {
        console.error("Erro ao gerar iCal:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});