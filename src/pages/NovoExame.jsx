import React from "react";
import DocumentForm from "../components/medical/DocumentForm";
import { ExameTemplate } from "@/entities/ExameTemplate";
import { FileCheck } from "lucide-react";
import PermissionGuard from "../components/PermissionGuard";

export default function NovoExame() {
  return (
    <PermissionGuard permission="can_access_templates">
      <DocumentForm
        tipo="exame"
        tipoLabel="Solicitação de Exames"
        icon={FileCheck}
        templateEntity={ExameTemplate}
      />
    </PermissionGuard>
  );
}