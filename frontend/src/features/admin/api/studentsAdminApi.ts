import { httpClient } from '../../../api/httpClient'
import type { StudentApiResponse, StudentApiUpsertPayload } from '../types/adminApiTypes'
import { extractApiErrorMessage } from './adminApiUtils'

export const listStudentsAdmin = async (): Promise<StudentApiResponse[]> => {
  try {
    const response = await httpClient.get<StudentApiResponse[]>('/students')
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch students.'))
  }
}

export const createStudentAdmin = async (
  payload: StudentApiUpsertPayload,
): Promise<StudentApiResponse> => {
  try {
    const response = await httpClient.post<StudentApiResponse>('/students', payload)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to create student.'))
  }
}

export const updateStudentAdmin = async (
  studentId: string,
  payload: StudentApiUpsertPayload,
): Promise<StudentApiResponse> => {
  try {
    const response = await httpClient.put<StudentApiResponse>(`/students/${studentId}`, payload)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to update student.'))
  }
}

export const deleteStudentAdmin = async (studentId: string): Promise<void> => {
  try {
    await httpClient.delete(`/students/${studentId}`)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to delete student.'))
  }
}
