export interface Step1FormData {
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  venueName: string;
  fallbackPhone: string;
}

export interface TimeSlot {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Step2FormData {
  reservationWindow: string;
  reservationDuration: string;
  maxPartySize: string;
  minHeadsUp: string;
  schedule: TimeSlot[];
}

export interface OnboardingData {
  step1: Step1FormData;
  step2: Step2FormData;
}
