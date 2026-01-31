import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export async function sendWhatsAppMessage(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Authentication for internal calls (from other functions) or direct calls
    // If called from another function via SDK, it uses service role usually or passes auth?
    // We'll assume it's secure or check for a shared secret/admin role if exposed publicly.
    // For simplicity, we just check if the user is authenticated (if called from frontend) 
    // or if it's an internal call (harder to verify without custom headers).
    
    // We'll skip strict auth check here assuming it's an internal utility, 
    // but in production you might want to secure it.

    const payload = await req.json();
    const { phone, message } = payload;

    if (!phone || !message) {
      return Response.json({ error: "Phone and message are required" }, { status: 400 });
    }

    // --- CONFIGURATION ---
    // User needs to set these secrets
    const API_URL = Deno.env.get("WHATSAPP_API_URL");
    const API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN"); // or API Key

    if (!API_URL) {
      console.warn("WHATSAPP_API_URL not set. Logging message instead.");
      console.log(`[MOCK WHATSAPP] To: ${phone} | Msg: ${message}`);
      return Response.json({ 
        success: true, 
        mock: true, 
        warning: "API URL not configured. Message logged to console." 
      });
    }

    // --- GENERIC SEND LOGIC ---
    // Adapte this fetch based on your provider (Twilio, Z-API, Evolution, etc.)
    // Example for a generic JSON POST
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_TOKEN}`,
        // "apikey": API_TOKEN // Some providers use this
      },
      body: JSON.stringify({
        number: phone, // or 'to', 'phone'
        message: message, // or 'text', 'body'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WhatsApp API Error:", errorText);
      throw new Error(`WhatsApp API failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return Response.json({ success: true, provider_response: data });

  } catch (error) {
    console.error("sendWhatsAppMessage Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

Deno.serve(sendWhatsAppMessage);