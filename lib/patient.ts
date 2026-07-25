export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say" | "";

export type PatientStatus = "no_activity" | "in_progress" | "idle" | "submitted";

export type ValidationErrors = Partial<Record<keyof PatientFormData, string>>;

export type PatientFormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  preferredLanguage: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  religion: string;
};

export type PatientSessionState = {
  formData: PatientFormData;
  validation: {
    isValid: boolean;
    errors: ValidationErrors;
  };
  status: PatientStatus;
  lastUpdatedAt: string | null;
  submittedAt: string | null;
};

export const defaultPatientFormData: PatientFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  preferredLanguage: "",
  nationality: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  religion: ""
};

export const defaultSessionState: PatientSessionState = {
  formData: defaultPatientFormData,
  validation: {
    isValid: false,
    errors: {}
  },
  status: "no_activity",
  lastUpdatedAt: null,
  submittedAt: null
};

const requiredFields: Array<keyof PatientFormData> = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "phone",
  "address",
  "preferredLanguage",
  "nationality"
];

const labels: Record<keyof PatientFormData, string> = {
  firstName: "First name",
  middleName: "Middle name",
  lastName: "Last name",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  phone: "Phone number",
  email: "Email",
  address: "Address",
  preferredLanguage: "Preferred language",
  nationality: "Nationality",
  emergencyContactName: "Emergency contact name",
  emergencyContactRelationship: "Emergency contact relationship",
  religion: "Religion"
};

export const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: "Female", value: "female" },
  { label: "Male", value: "male" },
  { label: "Non-binary", value: "non_binary" },
  { label: "Prefer not to say", value: "prefer_not_to_say" }
];

export const languageOptions = [
  "Thai",
  "English",
  "Mandarin",
  "Japanese",
  "Korean",
  "Arabic",
  "Other"
];

export const nationalityOptions = [
  "Thai",
  "American",
  "British",
  "Chinese",
  "Japanese",
  "Korean",
  "Singaporean",
  "Other"
];

export function validatePatientForm(formData: PatientFormData) {
  const errors: ValidationErrors = {};

  for (const field of requiredFields) {
    if (!String(formData[field]).trim()) {
      errors[field] = `${labels[field]} is required.`;
    }
  }

  if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  const phoneDigits = formData.phone.replace(/[^\d]/g, "");
  const phoneLooksValid = /^\+?[0-9()\-\s]{8,20}$/.test(formData.phone.trim()) && phoneDigits.length >= 8 && phoneDigits.length <= 15;
  if (formData.phone.trim() && !phoneLooksValid) {
    errors.phone = "Enter a valid phone number.";
  }

  const hasEmergencyName = Boolean(formData.emergencyContactName.trim());
  const hasEmergencyRelationship = Boolean(formData.emergencyContactRelationship.trim());
  if (hasEmergencyName && !hasEmergencyRelationship) {
    errors.emergencyContactRelationship = "Add the relationship for this emergency contact.";
  }
  if (!hasEmergencyName && hasEmergencyRelationship) {
    errors.emergencyContactName = "Add a name for this emergency contact.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function formatFieldValue(value: string | null | undefined) {
  return value?.trim() ? value : "Not provided";
}

export function statusLabel(status: PatientStatus) {
  const labelsByStatus: Record<PatientStatus, string> = {
    no_activity: "No activity",
    in_progress: "Typing / In progress",
    idle: "Idle",
    submitted: "Submitted"
  };

  return labelsByStatus[status];
}

export function getSessionId(searchParams: URLSearchParams) {
  return searchParams.get("sessionId")?.trim() || "demo";
}
