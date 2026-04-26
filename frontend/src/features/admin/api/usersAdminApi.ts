import { httpClient } from '../../../api/httpClient'
import type { UserApiResponse } from '../types/adminApiTypes'
import { extractApiErrorMessage } from './adminApiUtils'

export const listUsersAdmin = async (): Promise<UserApiResponse[]> => {
  try {
    const response = await httpClient.get<UserApiResponse[]>('/users')
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch users.'))
  }
}
