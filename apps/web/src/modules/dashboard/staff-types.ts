export type StaffMember = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
};

export type StaffActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
