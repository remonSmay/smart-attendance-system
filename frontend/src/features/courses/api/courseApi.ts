import { isAxiosError } from 'axios'

import { httpClient } from '../../../api/httpClient'
import type { CourseResponse, CourseDashboardResponse } from '../types/courseTypes'

const extractApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (isAxiosError<{ detail?: string }>(error)) {
    if (typeof error.response?.data?.detail === 'string') {
      return error.response.data.detail
    }
  }

  return fallbackMessage
}

export const getCourses = async (): Promise<CourseResponse[]> => {
  try {
    const response = await httpClient.get<CourseResponse[]>('/courses')
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch courses.'))
  }
}

export const searchCourses = async (query: string): Promise<CourseResponse[]> => {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return getCourses()
  }

  try {
    const response = await httpClient.get<CourseResponse[]>('/courses/search', {
      params: { query: trimmedQuery },
    })
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to search courses.'))
  }
}

export type { CourseResponse, CourseDashboardResponse }

export const getCourseDashboard = async (courseId: string): Promise<CourseDashboardResponse> => {
  try {
    const response = await httpClient.get<CourseDashboardResponse>(`/courses/${courseId}/dashboard`)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch course dashboard.'))
  }
}
