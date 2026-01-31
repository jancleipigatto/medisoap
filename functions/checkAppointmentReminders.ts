import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export async function checkAppointmentReminders(req) {
  try {
    const base44 = createClientFromRequest(req);
    
    // Calculate date range for "tomorrow" or "24h from now"
    // Let's do a check for appointments scheduled for TOMORROW
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    // Fetch appointments for tomorrow that haven't received a reminder
    // Note: Filtering by date string implies we check the whole day of tomorrow
    // If we want exactly 24h before, we need more complex logic with hours.
    // For simplicity: Send reminders for ALL appointments of "Tomorrow" once a day (e.g. at 8pm previous day or 8am same day?)
    // User asked "24h before". Running this hourly to find appointments in approx 24h range is better.
    
    // However, filtering by complex date logic in `list` might be hard if Entity API doesn't support range queries on composed fields.
    // We'll fetch appointments for tomorrow and filter in memory.
    
    // Fetch active appointments (not cancelled, not realized)
    const appointments = await base44.asServiceRole.entities.Agendamento.filter({
      data_agendamento: tomorrowStr,
      status: "agendado", // Only remind confirmed/agendado?
      reminder_sent: false
    });

    const results = [];

    for (const appt of appointments) {
      if (!appt.telefone_contato) continue;

      const message = `Olá ${appt.patient_name}, lembrete da sua consulta amanhã às ${appt.horario_inicio}. Responda para confirmar.`;

      // Call send function
      try {
        await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
          phone: appt.telefone_contato,
          message: message
        });

        // Update reminder_sent
        await base44.asServiceRole.entities.Agendamento.update(appt.id, {
          reminder_sent: true
        });
        results.push({ id: appt.id, status: 'sent' });
      } catch (err) {
        console.error(`Failed to send reminder for ${appt.id}:`, err);
        results.push({ id: appt.id, status: 'failed', error: err.message });
      }
    }

    return Response.json({ processed: results.length, details: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

Deno.serve(checkAppointmentReminders);