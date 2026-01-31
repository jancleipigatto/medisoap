import React from "react";
import PermissionGuard from "../components/PermissionGuard";
import TriagemContent from "../components/triagem/TriagemContent";

export default function Triagem() {
  return (
    <PermissionGuard permission="can_perform_triage">
      <TriagemContent />
    </PermissionGuard>
  );
}