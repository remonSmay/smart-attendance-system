export interface StudentSearchResult {
  id: string
  full_name: string
  rfid_uid: string
}

export interface ManualCheckInPayload {
  student_id: string
  attendance_session_id: string
  section_id: string
  device_id: string
  method_used: 'MANUAL'
}

export type ManualCheckInResponse = Record<string, unknown>
