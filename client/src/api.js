import axios from 'axios'

const api = axios.create({ baseURL: '/' })

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wa_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wa_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
