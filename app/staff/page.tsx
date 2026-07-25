import { Suspense } from "react";
import { StaffClient } from "./staff-client";

export default function StaffPage() {
  return (
    <Suspense>
      <StaffClient />
    </Suspense>
  );
}
