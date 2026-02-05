import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user already has a profile template
        if (user.profile_template_id) {
             return Response.json({ message: "User already has a profile" });
        }

        console.log(`Assigning default profile to user: ${user.email} (${user.id})`);

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
            
            // Update user
            await base44.asServiceRole.entities.User.update(user.id, updateData);
            console.log(`Applied default profile to user ${user.id}`);
            
            return Response.json({ success: true, message: `Applied profile ${defaultTemplate.nome}`, profile: updateData });
        } else {
            console.log("No default profile template found.");
            return Response.json({ success: false, message: "No default profile found" });
        }
    } catch (error) {
        console.error("Error in assignDefaultProfile:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});