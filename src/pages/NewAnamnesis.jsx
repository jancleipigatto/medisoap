import React from "react";
import PermissionGuard from "../components/PermissionGuard";
import NewAnamnesisContent from "../components/anamnesis/NewAnamnesisContent";

export default function NewAnamnesis() {
  return (
    <PermissionGuard permission="can_create_anamnesis">
      <NewAnamnesisContent />
    </PermissionGuard>
  );
}