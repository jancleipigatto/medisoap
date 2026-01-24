import React from "react";
import PermissionGuard from "../components/PermissionGuard";
import OrientacoesTemplatesContent from "../components/templates/OrientacoesTemplatesContent";

export default function OrientacoesTemplates() {
  return (
    <PermissionGuard permission="can_access_templates">
      <OrientacoesTemplatesContent />
    </PermissionGuard>
  );
}