export interface CourseResponse {
  id: string
  created_at: string
  updated_at: string
  course_name: string
  course_code: string
}

export interface AttendanceSummary {
  label: string
  present: number
  absent: number
}

export interface CourseDashboardResponse {
  total_students: number
  present_count: number
  absent_count: number
  attendance_percentage: number
  weekly_summaries: AttendanceSummary[]
  monthly_summaries: AttendanceSummary[]
}
