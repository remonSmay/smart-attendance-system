export interface AttendanceSessionCreate {
  section_id: string
  created_by_id: string
  title: string
  start_time: string
  end_time: string
}

export interface AttendanceSessionUpdate {
  title?: string
  start_time?: string
  end_time?: string
  is_active?: boolean
}

export interface AttendanceSessionResponse {
  id: string
  created_at: string
  updated_at: string
  section_id: string
  created_by_id: string
  title: string
  start_time: string
  end_time: string
  is_active: boolean
}
