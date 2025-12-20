export interface Step1FormData {
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  venueName: string;
  address: string;
  city: string;
  country: string;
}

export interface TimeSlot {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Step2FormData {
  fallbackPhone: string;
  schedule: TimeSlot[];
}

export interface VenueData {
  id: string;
  userId: string;
  managerName: string | null;
  managerEmail: string | null;
  managerPhone: string | null;
  venueName: string | null;
  fallbackPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  schedule: TimeSlot[] | null;
  onboardingStatus: "in-progress" | "completed";
  onboardingStep: number;
}
