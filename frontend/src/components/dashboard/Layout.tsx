import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  HomeIcon,
  ShoppingBagIcon,
  CubeIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/slices/authSlice'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon },
  { name: 'Ventas', href: '/app/sales', icon: ShoppingBagIcon },
  { name: 'Productos', href: '/app/products', icon: CubeIcon },
  { name: 'Clientes', href: '/app/customers', icon: UsersIcon },
  { name: 'Facturas', href: '/app/invoices', icon: DocumentTextIcon },
  { name: 'Reportes', href: '/app/reports', icon: ChartBarIcon },
  { name: 'Configuración', href: '/app/settings', icon: Cog6ToothIcon },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export const DashboardLayout: React.FC = () => {
  const { user, business, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 flex w-64 flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-gray-800">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            {/* Logo */}
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold text-white">ERP Conversacional</h1>
            </div>
            
            {/* Business info */}
            <div className="mt-5 px-4">
              <div className="rounded-md bg-gray-700 p-2">
                <p className="text-sm text-gray-300">{business?.business_name}</p>
                <p className="text-xs text-gray-400">RUC: {business?.ruc}</p>
                <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {business?.subscription_plan === 'free' ? 'Gratuito' : 'Pro'}
                </span>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    classNames(
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                    )
                  }
                >
                  <item.icon
                    className="mr-3 h-6 w-6 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          
          {/* User menu */}
          <div className="flex flex-shrink-0 border-t border-gray-700 p-4">
            <Menu as="div" className="relative w-full">
              <Menu.Button className="flex w-full items-center rounded-md text-sm text-white hover:bg-gray-700">
                <UserCircleIcon className="h-8 w-8 rounded-full" />
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium">{user ? `${user.first_name} ${user.last_name}` : ''}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute bottom-12 left-0 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={classNames(
                          active ? 'bg-gray-100' : '',
                          'block w-full px-4 py-2 text-left text-sm text-gray-700'
                        )}
                      >
                        Cerrar sesión
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow">
          <div className="flex h-16 justify-end px-4">
            <div className="flex items-center space-x-4">
              <button className="rounded-full p-1 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
