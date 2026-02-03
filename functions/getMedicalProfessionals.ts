import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export default Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticação
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Usar service role para listar usuários (bypass na restrição de admin-only para listagem)
        // Precisamos listar para filtrar quem são os médicos
        const allUsers = await base44.asServiceRole.entities.User.list();
        
        // Filtrar apenas usuários que podem atender (médicos/profissionais)
        // Critério: can_create_anamnesis = true OU is_master = true OU can_manage_own_schedule = true
        const professionals = allUsers.filter(u => 
            u.can_create_anamnesis === true || u.is_master === true || u.can_manage_own_schedule === true
        );

        // Retornar apenas dados necessários e seguros
        const safeProfessionals = professionals.map(p => ({
            id: p.id,
            full_name: p.full_name,
            email: p.email
        }));

        return Response.json(safeProfessionals);
    } catch (error) {
        console.error("Error fetching professionals:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});