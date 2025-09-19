import type { NavGroup } from '@/components/AppSidebar/types'
import {
  BadgeHelp,
  Boxes,
  Bug,
  LayoutDashboard,
  ListTodo,
  Settings,
  SquareUserRound,
  Users,
} from 'lucide-vue-next'

export function useSidebar() {
  const navData = ref<NavGroup[]>()

  navData.value = [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: 'Apps',
          url: '/apps',
          icon: Boxes,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: SquareUserRound,
          items: [
            { title: 'Sign In', url: '/auth/sign-in' },
            { title: 'Sign In(2 Col)', url: '/auth/sign-in-2' },
            { title: 'Sign Up', url: '/auth/sign-up' },
            { title: 'Forgot Password', url: '/auth/forgot-password' },
            { title: 'OTP', url: '/auth/otp' },
          ],
        },
        {
          title: 'Errors',
          icon: Bug,
          items: [
            { title: '401 | Unauthorized', url: '/errors/401' },
            { title: '403 | Forbidden', url: '/errors/403' },
            { title: '404 | Not Found', url: '/errors/404' },
            { title: '500 | Internal Server Error', url: '/errors/500' },
            { title: '503 | Maintenance Error', url: '/errors/503' },
          ],
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            { title: 'Profile', url: '/settings/' },
            { title: 'Account', url: '/settings/account' },
            { title: 'Appearance', url: '/settings/appearance' },
            { title: 'Notifications', url: '/settings/notifications' },
            { title: 'Display', url: '/settings/display' },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: BadgeHelp,
        },
      ],
    },
  ]

  return {
    navData,
  }
}
