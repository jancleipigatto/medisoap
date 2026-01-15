import React from "react";
import ReceitaForm from "../components/medical/ReceitaForm";
import { ReceitaTemplate } from "@/entities/ReceitaTemplate";
import PermissionGuard from "../components/PermissionGuard";

export default function NovaReceita() {
  return (
    <PermissionGuard permission="can_access_templates">
      <ReceitaForm templateEntity={ReceitaTemplate} />
    </PermissionGuard>
  );
}