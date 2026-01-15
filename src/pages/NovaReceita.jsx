import React from "react";
import DocumentForm from "../components/medical/DocumentForm";
import { ReceitaTemplate } from "@/entities/ReceitaTemplate";
import { Pill } from "lucide-react";
import PermissionGuard from "../components/PermissionGuard";

export default function NovaReceita() {
  return (
    <PermissionGuard permission="can_access_templates">
      <DocumentForm
        tipo="receita"
        tipoLabel="Receita Médica"
        icon={Pill}
        templateEntity={ReceitaTemplate}
      />
    </PermissionGuard>
  );
}