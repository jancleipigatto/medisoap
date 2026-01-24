import React from "react";
import PermissionGuard from "../components/PermissionGuard";
import TemplatesContent from "../components/templates/TemplatesContent";

export default function OrientacoesTemplates() {
  return (
    <PermissionGuard permission="can_access_templates">
      <TemplatesContent 
        entityName="OrientacoesTemplate"
        title="Modelos de Orientações"
        description="Gerencie seus modelos de orientações ao paciente"
        fieldLabel="Texto das Orientações"
      />
    </PermissionGuard>
  );
}