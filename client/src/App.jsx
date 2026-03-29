import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import SendMessage from './pages/SendMessage'
import Templates from './pages/Templates'
import Logs from './pages/Logs'

function PrivateRoute({ children }) {
  return localStorage.getItem('wa_token') ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/send" element={<SendMessage />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/logs" element={<Logs />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
