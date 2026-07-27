export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any[]
  }
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export function successResponse<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return { success: true, data, ...(meta && { meta }) }
}

export function errorResponse(message: string, code: string, details?: any[]): ApiResponse {
  return { success: false, error: { message, code, details } }
}