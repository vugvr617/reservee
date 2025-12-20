import { TimeSlot } from "./types";

export const TOTAL_STEPS = 3;

export const DEFAULT_SCHEDULE: TimeSlot[] = [
  { day: "Monday", open: "09:00", close: "22:00", closed: false },
  { day: "Tuesday", open: "09:00", close: "22:00", closed: false },
  { day: "Wednesday", open: "09:00", close: "22:00", closed: false },
  { day: "Thursday", open: "09:00", close: "22:00", closed: false },
  { day: "Friday", open: "09:00", close: "22:00", closed: false },
  { day: "Saturday", open: "09:00", close: "22:00", closed: false },
  { day: "Sunday", open: "09:00", close: "22:00", closed: false },
];

export const STEP_TITLES = {
  1: "Let's get started",
  2: "Business Details",
} as const;

export const STEP_DESCRIPTIONS = {
  1: "Tell us about you and your venue",
  2: "Set up your reservation policies and hours",
} as const;
