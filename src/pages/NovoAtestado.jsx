import React from "react";
import DocumentForm from "../components/medical/DocumentForm";
import { AtestadoTemplate } from "@/entities/AtestadoTemplate";
import { ClipboardList } from "lucide-react";
import PermissionGuard from "../components/PermissionGuard";

export default function NovoAtestado() {
  return (
    <PermissionGuard permission="can_access_templates">
      <DocumentForm
        tipo="atestado"
        tipoLabel="Atestado Médico"
        icon={ClipboardList}
        templateEntity={AtestadoTemplate}
      />
    </PermissionGuard>
  );
}