import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export async function checkPostConsultation(req) {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check for appointments from YESTERDAY that were "realizado"
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const appointments = await base44.asServiceRole.entities.Agendamento.filter({
      data_agendamento: yesterdayStr,
      status: "realizado",
      followup_sent: false
    });

    const results = [];

    for (const appt of appointments) {
      if (!appt.telefone_contato) continue;

      const message = `Olá ${appt.patient_name}, esperamos que sua consulta ontem tenha sido ótima. Caso tenha dúvidas ou precise de algo, entre em contato.`;

      try {
        await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
          phone: appt.telefone_contato,
          message: message
        });

        await base44.asServiceRole.entities.Agendamento.update(appt.id, {
          followup_sent: true
        });
        results.push({ id: appt.id, status: 'sent' });
      } catch (err) {
        console.error(`Failed to send follow-up for ${appt.id}:`, err);
        results.push({ id: appt.id, status: 'failed', error: err.message });
      }
    }

    return Response.json({ processed: results.length, details: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

Deno.serve(checkPostConsultation);