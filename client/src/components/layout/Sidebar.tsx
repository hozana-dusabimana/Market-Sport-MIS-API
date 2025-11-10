import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard,
  MapPin,
  Square,
  UserPlus,
  CreditCard,
  FileText,
  Bell,
  Settings,
  ShoppingBag,
  Receipt,
  Users,
  UserCog,
} from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuthStore()

  const isActive = (path: string) => location.pathname === path

  const adminMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/zones', label: 'Zones', icon: MapPin },
    { path: '/spaces', label: 'Spaces', icon: Square },
    { path: '/sellers', label: 'Sellers', icon: Users },
    { path: '/users', label: 'Users', icon: UserCog },
    { path: '/seller-registration', label: 'Seller Registration', icon: UserPlus },
    { path: '/allocations', label: 'Allocations', icon: ShoppingBag },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/profile', label: 'Profile', icon: Settings },
  ]

  const sellerMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/my-spaces', label: 'My Spaces', icon: Square },
    { path: '/my-payments', label: 'My Payments', icon: Receipt },
    { path: '/my-notifications', label: 'Notifications', icon: Bell },
    { path: '/profile', label: 'Profile', icon: Settings },
  ]

  const managerMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/zones', label: 'Zones', icon: MapPin },
    { path: '/spaces', label: 'Spaces', icon: Square },
    { path: '/allocations', label: 'Allocations', icon: ShoppingBag },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/profile', label: 'Profile', icon: Settings },
  ]

  const menuItems =
    user?.user_type === 'admin'
      ? adminMenuItems
      : user?.user_type === 'manager'
      ? managerMenuItems
      : sellerMenuItems

  return (
    <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-73px)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar


