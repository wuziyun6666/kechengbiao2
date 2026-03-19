export interface CourseSession {
  id: string;
  courseName: string;
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location?: string;
  teacher?: string;
  remark?: string;
  weeks: number[]; // e.g., [1, 2, 3, 4]
}
