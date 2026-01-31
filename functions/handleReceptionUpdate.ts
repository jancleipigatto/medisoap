import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export async function handleReceptionUpdate(req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data, old_data } = payload;

    // Only interested in updates where status changes TO 'recepcionado'
    if (event.type !== 'update') return Response.json({ message: "Ignored: not an update" });
    
    const newStatus = data.status;
    const oldStatus = old_data?.status;

    if (newStatus === 'recepcionado' && oldStatus !== 'recepcionado') {
      if (!data.telefone_contato) {
         return Response.json({ message: "Ignored: no phone number" });
      }

      const message = `Olá ${data.patient_name}, sua chegada foi confirmada na recepção. Por favor, aguarde ser chamado para a triagem.`;

      await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
        phone: data.telefone_contato,
        message: message
      });

      return Response.json({ message: "Confirmation sent" });
    }

    return Response.json({ message: "Ignored: status condition not met" });
  } catch (error) {
    console.error("handleReceptionUpdate Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

Deno.serve(handleReceptionUpdate);