import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export async function syncExternalCalendars(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { professional_id } = await req.json();

    if (!professionalId) {
        return Response.json({ error: "Professional ID required" }, { status: 400 });
    }

    // Load Settings
    const settingsList = await base44.asServiceRole.entities.AgendaSettings.filter({ professional_id: professionalId });
    const settings = settingsList[0];

    if (!settings || !settings.google_sync_enabled) {
        return Response.json({ message: "Sync disabled" });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
    if (!accessToken) {
        return Response.json({ error: "Google Token not found" }, { status: 400 });
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

    // 2. Process events
    // Strategy: Create "ScheduleBlock" for events that are NOT created by our app (don't have our signature/description pattern or match an existing appointment)
    // Actually, simpler: Any event in Google that is marked as "Busy" (transparency != 'transparent') should be a block in our app.
    // If we created the event, we should ignore it to avoid duplication (App -> Google -> App).
    // How to identify our events?
    // We can check if the description contains "Consulta:" or matches an ID.
    // Ideally, we store the `google_event_id` in our DB.
    // So if a Google Event ID exists in our Agendamento table, we ignore it.
    
    // Get all existing appointments with google_event_id
    const existingAppointments = await base44.asServiceRole.entities.Agendamento.filter({ 
        google_event_id: { "$ne": null } 
    });
    const knownGoogleIds = new Set(existingAppointments.map(a => a.google_event_id));

    let blocksCreated = 0;

    for (const event of googleEvents) {
        // Skip if we know this event (it originated from our app)
        if (knownGoogleIds.has(event.id)) continue;

        // Skip if event is "Free" (transparency: 'transparent')
        if (event.transparency === 'transparent') continue;

        // Skip all-day events for now unless they are blocking
        const isAllDay = !event.start.dateTime;
        
        // Parse dates
        const startDate = isAllDay ? event.start.date : event.start.dateTime.split('T')[0];
        const endDate = isAllDay ? event.end.date : event.end.dateTime.split('T')[0];
        const startTime = isAllDay ? null : event.start.dateTime.split('T')[1].substring(0, 5);
        const endTime = isAllDay ? null : event.end.dateTime.split('T')[1].substring(0, 5);

        // Check if block already exists for this event (deduplication)
        // We can use a unique identifier in the reason or a new field.
        // For now, let's check if a block exists with same time/date and reason.
        const reason = `Google: ${event.summary || 'Ocupado'}`;
        
        const existingBlock = await base44.asServiceRole.entities.ScheduleBlock.filter({
            professional_id: professionalId,
            start_date: startDate,
            start_time: startTime || { "$exists": false }, // simple check
            reason: reason
        });

        if (existingBlock.length === 0) {
            await base44.asServiceRole.entities.ScheduleBlock.create({
                professional_id: professionalId,
                start_date: startDate,
                end_date: endDate || startDate,
                start_time: startTime,
                end_time: endTime,
                is_all_day: isAllDay,
                reason: reason,
                recurrence: 'none'
            });
            blocksCreated++;
        }
    }

    return Response.json({ 
        message: "Sync completed", 
        eventsProcessed: googleEvents.length,
        blocksCreated 
    });

  } catch (error) {
    console.error("Sync Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

Deno.serve(syncExternalCalendars);