import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { code } = body;

        // In a real app, verify against stored code.
        // For demo, we accept "123456".
        
        if (code === "123456") {
            // Update user as verified
            await base44.auth.updateMe({ phone_verified: true });
            
            return Response.json({ success: true, message: "Telefone verificado com sucesso!" });
        } else {
            return Response.json({ error: "Código inválido" }, { status: 400 });
        }

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});