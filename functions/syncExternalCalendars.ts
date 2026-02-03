import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export async function syncExternalCalendars(req) {
  try {
    const base44 = createClientFromRequest(req);
    let professionalId;
    try {
        const body = await req.json();
        professionalId = body.professional_id;
    } catch (e) {
        // Request might be empty (scheduled task)
    }

    // Function to sync a single professional
    const syncProfessional = async (settings) => {
        const pId = settings.professional_id;
        try {
            // Note: Currently we use the APP OWNER'S token for all syncs because of connector limitations.
            // If the app is intended for multiple doctors with their OWN google accounts, 
            // the current architecture (using app owner connector) puts everyone on the SAME calendar.
            // However, assuming single-tenant or shared practice calendar for now.
            const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
            if (!accessToken) {
                console.error(`No Google Token for sync (Prof: ${pId})`);
                return 0;
            }

            // 1. Fetch upcoming events from Google (Next 30 days)
            const now = new Date();
            const next30Days = new Date();
            next30Days.setDate(now.getDate() + 30);

            const params = new URLSearchParams({
                timeMin: now.toISOString(),
                timeMax: next30Days.toISOString(),
                singleEvents: 'true',
                orderBy: 'startTime'
            });

            const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!resp.ok) {
                throw new Error(await resp.text());
            }

            const { items: googleEvents } = await resp.json();
            
            // Get all existing appointments with google_event_id
            const existingAppointments = await base44.asServiceRole.entities.Agendamento.filter({ 
                google_event_id: { "$ne": null } 
            });
            const knownGoogleIds = new Set(existingAppointments.map(a => a.google_event_id));

            let created = 0;

            for (const event of googleEvents) {
                if (knownGoogleIds.has(event.id)) continue;
                if (event.transparency === 'transparent') continue;

                const isAllDay = !event.start.dateTime;
                const startDate = isAllDay ? event.start.date : event.start.dateTime.split('T')[0];
                const endDate = isAllDay ? event.end.date : event.end.dateTime.split('T')[0];
                const startTime = isAllDay ? null : event.start.dateTime.split('T')[1].substring(0, 5);
                const endTime = isAllDay ? null : event.end.dateTime.split('T')[1].substring(0, 5);

                const reason = `Google: ${event.summary || 'Ocupado'}`;
                
                const existingBlock = await base44.asServiceRole.entities.ScheduleBlock.filter({
                    professional_id: pId,
                    start_date: startDate,
                    start_time: startTime || { "$exists": false },
                    reason: reason
                });

                if (existingBlock.length === 0) {
                    await base44.asServiceRole.entities.ScheduleBlock.create({
                        professional_id: pId,
                        start_date: startDate,
                        end_date: endDate || startDate,
                        start_time: startTime,
                        end_time: endTime,
                        is_all_day: isAllDay,
                        reason: reason,
                        recurrence: 'none'
                    });
                    created++;
                }
            }
            return created;
        } catch (err) {
            console.error(`Error syncing professional ${pId}:`, err);
            return 0;
        }
    };

    if (professionalId) {
        // Sync specific
        const settingsList = await base44.asServiceRole.entities.AgendaSettings.filter({ professional_id: professionalId });
        const settings = settingsList[0];
        if (!settings || !settings.google_sync_enabled) return Response.json({ message: "Sync disabled" });
        
        const blocks = await syncProfessional(settings);
        return Response.json({ message: "Sync completed", blocksCreated: blocks });
    } else {
        // Sync ALL enabled
        const allSettings = await base44.asServiceRole.entities.AgendaSettings.filter({ google_sync_enabled: true });
        let totalBlocks = 0;
        for (const settings of allSettings) {
            totalBlocks += await syncProfessional(settings);
        }
        return Response.json({ message: "Global sync completed", totalBlocks });
    }

    // End of modified code block (removed original single-user logic below to avoid dup)
    // 1. Fetch upcoming events... (this part is now inside syncProfessional)
    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    // Logic moved to syncProfessional helper
  } catch (error) {
    console.error("Sync Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

Deno.serve(syncExternalCalendars);

  } catch (error) {
    console.error("Sync Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

Deno.serve(syncExternalCalendars);