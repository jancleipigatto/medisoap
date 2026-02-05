import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function is triggered by User create event
        const payload = await req.json();
        const { event, data } = payload;
        
        // If not a create event or missing data, skip
        if (event.type !== 'create' || !data || !data.id) {
            return Response.json({ message: "Ignored event" });
        }

        const user = data;
        console.log(`Processing new user: ${user.email} (${user.id})`);

        // Find default profile template
        const templates = await base44.asServiceRole.entities.ProfileTemplate.filter({ is_default: true });
        
        if (templates.length > 0) {
            const defaultTemplate = templates[0];
            console.log(`Found default profile template: ${defaultTemplate.nome}`);
            
            // Construct update data
            const updateData = {
                profile_template_id: defaultTemplate.id,
                profile_type: defaultTemplate.nome || 'Standard',
                // Copy permissions
                can_access_templates: defaultTemplate.can_access_templates,
                can_access_patients: defaultTemplate.can_access_patients,
                can_create_anamnesis: defaultTemplate.can_create_anamnesis,
                can_view_all_anamnesis: defaultTemplate.can_view_all_anamnesis,
                can_access_reception: defaultTemplate.can_access_reception,
                can_perform_triage: defaultTemplate.can_perform_triage,
                can_manage_schedule: defaultTemplate.can_manage_schedule,
                can_manage_own_schedule: defaultTemplate.can_manage_own_schedule
            };
            
            // If user is the very first user (or master), we might not want to override if they are admin?
            // Usually the first user is created as admin by the system, but let's assume standard behavior.
            // If the user already has a role 'admin', we might want to skip or be careful.
            // But usually new invites are 'user'.
            
            if (user.role !== 'admin') {
                await base44.asServiceRole.entities.User.update(user.id, updateData);
                console.log(`Applied default profile to user ${user.id}`);
            } else {
                 console.log(`User ${user.id} is admin, skipping default profile application`);
            }
            
            return Response.json({ success: true, message: `Applied profile ${defaultTemplate.nome}` });
        } else {
            console.log("No default profile template found.");
            return Response.json({ success: false, message: "No default profile found" });
        }
    } catch (error) {
        console.error("Error in onUserCreate:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});