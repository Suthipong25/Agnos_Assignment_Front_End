import { Suspense } from "react";
import { PatientClient } from "./patient-client";

export default function PatientPage() {
  return (
    <Suspense>
      <PatientClient />
    </Suspense>
  );
}
