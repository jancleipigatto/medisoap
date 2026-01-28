import React from "react";
import PermissionGuard from "../components/PermissionGuard";
import DocumentForm from "../components/medical/DocumentForm";
import { Info } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function NovaOrientacao() {
  return (
    <PermissionGuard permission="can_access_templates">
      <DocumentForm 
        tipo="orientacoes"
        tipoLabel="Orientação"
        icon={Info}
        templateEntity={base44.entities.OrientacoesTemplate}
      />
    </PermissionGuard>
  );
}