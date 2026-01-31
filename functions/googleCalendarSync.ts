import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export async function googleCalendarSync(req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data, old_data } = payload;

    // Verify authentication via service role or check if triggered by automation
    // Automations typically run with system privileges, but we need the App Owner's calendar token
    // The "googlecalendar" connector is linked to the App Builder's account.

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

    // Prevent infinite loops on update:
    // If this update was just setting the google_event_id, ignore it.
    if (event.type === 'update' && old_data) {
      // Check if critical fields changed
      const fieldsToCheck = ['patient_name', 'data_agendamento', 'horario_inicio', 'horario_fim', 'observacoes', 'status'];
      const hasChanges = fieldsToCheck.some(field => data[field] !== old_data[field]);
      
      if (!hasChanges) {
        console.log("No relevant fields changed. Skipping sync.");
        return Response.json({ message: "Skipped: No relevant changes" });
      }
    }

    const eventBody = {
      summary: `Consulta: ${data?.patient_name || 'Paciente'}`,
      description: `Tipo: ${data?.tipo}\nStatus: ${data?.status}\nObs: ${data?.observacoes || '-'}`,
      ...(data ? getStartEnd(data) : {})
    };

    if (event.type === 'create') {
      // Create event
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
      
      // Update entity with google_event_id
      // We use asServiceRole to bypass RLS if needed, though automations usually have access
      await base44.asServiceRole.entities.Agendamento.update(data.id, {
        google_event_id: googleEvent.id
      });

      return Response.json({ message: "Created Google Event", google_id: googleEvent.id });
    } 
    
    else if (event.type === 'update') {
      const eventId = data.google_event_id || old_data?.google_event_id;
      
      if (!eventId) {
        // Should create if it doesn't exist? Yes.
        console.log("No Google Event ID found on update. Creating new event.");
        // Call create logic recursively or duplicate code? Duplicating for simplicity in this context
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

      // Update existing
      const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventBody)
      });

      if (!resp.ok) {
         // If 404/410, maybe recreate? For now just log.
         const err = await resp.text();
         console.error("Google Calendar Update Error:", err);
         return Response.json({ error: err }, { status: 500 });
      }
      
      return Response.json({ message: "Updated Google Event" });
    } 
    
    else if (event.type === 'delete') {
      const eventId = old_data?.google_event_id; // For delete, data might be null, use old_data
      if (!eventId) {
        return Response.json({ message: "Skipped delete: No Google Event ID" });
      }

      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return Response.json({ message: "Deleted Google Event" });
    }

    return Response.json({ message: "No action taken" });

  } catch (error) {
    console.error("Sync Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Deno handler
Deno.serve(googleCalendarSync);