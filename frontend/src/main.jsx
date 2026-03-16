// src/main.jsx
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import useAuthStore from './store/authStore'
import i18n from './i18n'

function InitI18n() {
  const { user, refreshUser } = useAuthStore()
  
  useEffect(() => {
    // If user is logged in, sync i18n with their language preference
    if (user?.language) {
      i18n.changeLanguage(user.language)
    }
  }, [user?.language])
  
  return null
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <InitI18n />
    <App />
  </StrictMode>,
)
