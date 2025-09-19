import { RouterPath } from '@/enums/global'

export function useAuth() {
  const router = useRouter()

  function logout() {
    router.push({ path: RouterPath.LOGIN })
  }

  function toHome() {
    router.push({ path: RouterPath.HOME })
  }

  function login() {
    toHome()
  }

  return {
    logout,
    login,
  }
}
