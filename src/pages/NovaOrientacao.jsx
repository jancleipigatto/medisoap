import React from "react";
import PermissionGuard from "../components/PermissionGuard";
import DocumentForm from "../components/medical/DocumentForm";

export default function NovaOrientacao() {
  return (
    <PermissionGuard permission="can_access_templates">
      <DocumentForm 
        entityName="OrientacoesTemplate"
        documentType="orientacoes"
        title="Nova Orientação ao Paciente"
        description="Crie orientações ao paciente usando modelos pré-configurados"
        fieldLabel="Orientações"
        placeholder="Digite as orientações ao paciente (cuidados, recomendações, sinais de alerta, etc.)..."
      />
    </PermissionGuard>
  );
}