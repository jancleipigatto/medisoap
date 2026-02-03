import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export async function googleCalendarSync(req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data, old_data } = payload;

    // Check if user has sync enabled
    // We need to find the professional_id. 
    // In Agendamento entity, we have professional_id.
    const professionalId = data?.professional_id || old_data?.professional_id;
    
    if (!professionalId) {
        console.log("No professional ID found. Skipping sync.");
        return Response.json({ message: "Skipped: No professional ID" });
    }

    // Get Settings
    const settingsList = await base44.asServiceRole.entities.AgendaSettings.filter({ professional_id: professionalId });
    const settings = settingsList[0];

    if (!settings || !settings.google_sync_enabled) {
        console.log("Google Sync disabled for this professional. Skipping.");
        return Response.json({ message: "Skipped: Sync disabled" });
    }

    // Check if appointment type is selected
    const type = data?.tipo || old_data?.tipo;
    if (settings.google_sync_types && !settings.google_sync_types.includes(type)) {
        console.log(`Type ${type} not enabled for sync. Skipping.`);
        return Response.json({ message: "Skipped: Type not enabled" });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
    if (!accessToken) {
      console.log("No Google Calendar access token found. Skipping sync.");
      return Response.json({ message: "Skipped: No token" });
    }

    // Helper to format date/time for Google API
    const getStartEnd = (record) => {
      const date = record.data_agendamento; // YYYY-MM-DD
      const start = record.horario_inicio; // HH:mm
      const end = record.horario_fim || calculateEndTime(start); // HH:mm or calculated

      return {
        start: { dateTime: `${date}T${start}:00`, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: `${date}T${end}:00`, timeZone: 'America/Sao_Paulo' }
      };
    };

    const calculateEndTime = (startTime) => {
      if (!startTime) return "00:00";
      const [h, m] = startTime.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m + 30); // Default 30 min duration
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const eventBody = {
      summary: `Consulta: ${data?.patient_name || 'Paciente'}`,
      description: `Tipo: ${data?.tipo}\nStatus: ${data?.status}\nObs: ${data?.observacoes || '-'}`,
      ...(data ? getStartEnd(data) : {})
    };

    if (event.type === 'create') {
      const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventBody)
      });
      
      if (!resp.ok) {
        const err = await resp.text();
        console.error("Google Calendar Create Error:", err);
        return Response.json({ error: err }, { status: 500 });
      }

      const googleEvent = await resp.json();
      
      await base44.asServiceRole.entities.Agendamento.update(data.id, {
        google_event_id: googleEvent.id
      });

      return Response.json({ message: "Created Google Event", google_id: googleEvent.id });
    } 
    
    else if (event.type === 'update') {
      // Prevent infinite loop from the update above
      if (old_data && data.google_event_id && data.google_event_id !== old_data.google_event_id) {
          // This update was probably caused by the sync function itself setting the ID
          return Response.json({ message: "Skipped: Internal update" });
      }

      const eventId = data.google_event_id || old_data?.google_event_id;
      
      if (!eventId) {
        // If no ID, treat as create
        const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventBody)
        });
        const googleEvent = await resp.json();
        await base44.asServiceRole.entities.Agendamento.update(data.id, { google_event_id: googleEvent.id });
        return Response.json({ message: "Created missing Google Event on update", google_id: googleEvent.id });
      }

      const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventBody)
      });

      if (!resp.ok) return Response.json({ error: await resp.text() }, { status: 500 });
      
      return Response.json({ message: "Updated Google Event" });
    } 
    
    else if (event.type === 'delete') {
      const eventId = old_data?.google_event_id;
      if (!eventId) return Response.json({ message: "Skipped delete: No Google Event ID" });

      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return Response.json({ message: "Deleted Google Event" });
    }

    return Response.json({ message: "No action taken" });

  } catch (error) {
    console.error("Sync Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

Deno.serve(googleCalendarSync);