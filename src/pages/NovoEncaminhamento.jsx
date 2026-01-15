import React from "react";
import DocumentForm from "../components/medical/DocumentForm";
import { EncaminhamentoTemplate } from "@/entities/EncaminhamentoTemplate";
import { Send } from "lucide-react";
import PermissionGuard from "../components/PermissionGuard";

export default function NovoEncaminhamento() {
  return (
    <PermissionGuard permission="can_access_templates">
      <DocumentForm
        tipo="encaminhamento"
        tipoLabel="Encaminhamento Médico"
        icon={Send}
        templateEntity={EncaminhamentoTemplate}
      />
    </PermissionGuard>
  );
}