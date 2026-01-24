import React from "react";
import ReceitaFormAdvanced from "../components/medical/ReceitaFormAdvanced";
import PermissionGuard from "../components/PermissionGuard";

export default function NovaReceita() {
  return (
    <PermissionGuard permission="can_access_templates">
      <ReceitaFormAdvanced />
    </PermissionGuard>
  );
}