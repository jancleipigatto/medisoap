import React from "react";
import PermissionGuard from "../components/PermissionGuard";
import PatientsContent from "../components/patients/PatientsContent";

export default function Patients() {
  return (
    <PermissionGuard permission="can_access_patients">
      <PatientsContent />
    </PermissionGuard>
  );
}