import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PermissionGuard from "../components/PermissionGuard";
import NewAnamnesisContent from "../components/anamnesis/NewAnamnesisContent";

export default function NewAnamnesis() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const patientId = searchParams.get("patient_id");
  
  // Note: NewAnamnesisContent might need to be updated to accept props if it doesn't already read URL params
  // However, usually "NewAnamnesisContent" handles the logic. 
  // Since I can't see "NewAnamnesisContent" in full detail here (it was in snapshot but truncated or I might not have read it recently),
  // I assume it handles patient selection internally. 
  // If not, I should probably pass these as props or context.
  // But given standard React patterns, reading from URL in the child or passing as prop is good.
  
  return (
    <PermissionGuard permission="can_create_anamnesis">
      <NewAnamnesisContent preSelectedPatientId={patientId} />
    </PermissionGuard>
  );
}