import React from "react";
import PermissionGuard from "../components/PermissionGuard";
import TriagemContent from "../components/triagem/TriagemContent";

export default function Triagem() {
  return (
    <PermissionGuard permission="can_create_anamnesis">
      <TriagemContent />
    </PermissionGuard>
  );
}