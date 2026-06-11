const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const apiClient = {
  async request<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      method,
      headers,
    }

    if (data) {
      config.body = JSON.stringify(data)
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(text || `API Error: ${response.status}`)
    }

    return response.json()
  },

  get<T>(endpoint: string) {
    return this.request<T>('GET', endpoint)
  },

  post<T>(endpoint: string, data: Record<string, any>) {
    return this.request<T>('POST', endpoint, data)
  },

  put<T>(endpoint: string, data: Record<string, any>) {
    return this.request<T>('PUT', endpoint, data)
  },

  patch<T>(endpoint: string, data: Record<string, any>) {
    return this.request<T>('PATCH', endpoint, data)
  },

  delete<T>(endpoint: string) {
    return this.request<T>('DELETE', endpoint)
  },

  delete_with_body<T>(endpoint: string, data: Record<string, any>) {
    return this.request<T>('DELETE', endpoint, data)
  },
}
