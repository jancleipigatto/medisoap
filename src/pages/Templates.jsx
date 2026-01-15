import React from "react";
import PermissionGuard from "../components/PermissionGuard";
import TemplatesContent from "../components/templates/TemplatesContent";

export default function Templates() {
  return (
    <PermissionGuard permission="can_access_templates">
      <TemplatesContent />
    </PermissionGuard>
  );
}