import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useEffect } from 'react'
import { useThemeStore } from '../../store/themeStore'

const Layout = () => {
  const { theme } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 text-gray-900 dark:text-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout


