import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { phone } = body;

        if (!phone) {
            return Response.json({ error: 'Phone number required' }, { status: 400 });
        }

        // Generate a random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // In a real app, we would send this via SMS using Twilio, SNS, etc.
        // For now, we will simulate it. 
        // We'll store the code in a KV store or just assume it works for demo.
        // Since we don't have KV access easily here without setting it up, 
        // we'll just return the code in the response for "demo" purposes or log it.
        // For security in production, NEVER return the code to the client.
        
        console.log(`[MOCK SMS] Sending code ${code} to ${phone}`);

        // We can simulate a "sent" status.
        // The user will have to enter "123456" (fixed for demo) or we use the logged code.
        // Let's use a fixed code for simplicity in this demo environment: "123456"
        
        return Response.json({ 
            success: true, 
            message: "Código enviado com sucesso (Simulado)",
            demo_code: "123456" // For testing convenience
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});