import axios from 'axios'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response): any => {
    const body = response.data as ApiResponse<unknown>
    if (body.code !== 200) return Promise.reject(new Error(body.message || '请求失败'))
    return body.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_username')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default http
