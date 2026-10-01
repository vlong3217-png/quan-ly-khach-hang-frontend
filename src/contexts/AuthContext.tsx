import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, AuthState } from '../types/auth.ts'

/* ──────────── Storage keys ──────────── */
const STORAGE_KEY_TOKEN = 'access_token'
const STORAGE_KEY_USER = 'user'
const FALLBACK_KEY_TOKEN = 'auth_token'
const FALLBACK_KEY_USER = 'auth_user'

/* ──────────── Context shape ──────────── */
interface AuthContextValue extends AuthState {
  /** Lưu token + user sau khi đăng nhập thành công */
  login: (token: string, user: User, rememberMe?: boolean) => void
  /** Đăng xuất: xóa token, user session, cập nhật state */
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/* ──────────── Helpers ──────────── */
function loadUserFromStorage(): User | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY_USER) ||
      sessionStorage.getItem(STORAGE_KEY_USER) ||
      localStorage.getItem(FALLBACK_KEY_USER) ||
      sessionStorage.getItem(FALLBACK_KEY_USER)

    if (!raw) return null
    const parsed = JSON.parse(raw) as User
    if (parsed && typeof parsed === 'object' && ('id' in parsed || 'email' in parsed)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function loadTokenFromStorage(): string | null {
  try {
    return (
      localStorage.getItem(STORAGE_KEY_TOKEN) ||
      sessionStorage.getItem(STORAGE_KEY_TOKEN) ||
      localStorage.getItem(FALLBACK_KEY_TOKEN) ||
      sessionStorage.getItem(FALLBACK_KEY_TOKEN)
    )
  } catch {
    return null
  }
}

/**
 * Giải mã JWT payload an toàn (hỗ trợ base64url, unicode).
 * Trả về null nếu token không hợp lệ.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4 !== 0) {
      base64 += '='
    }

    try {
      const jsonStr = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonStr) as Record<string, unknown>
    } catch {
      return JSON.parse(atob(base64)) as Record<string, unknown>
    }
  } catch {
    return null
  }
}

/**
 * Kiểm tra token có hợp lệ và chưa hết hạn không.
 */
function isTokenValid(token: string | null): boolean {
  if (!token || typeof token !== 'string') return false
  const trimmed = token.trim()
  if (!trimmed) return false

  // Kiểm tra định dạng JWT (3 phần phân tách bởi dấu '.')
  const parts = trimmed.split('.')
  if (parts.length === 3) {
    const payload = decodeJwtPayload(trimmed)
    if (!payload) {
      return false // Token JWT bị hỏng cấu trúc
    }

    // Nếu token có claim `exp`, kiểm tra thời gian hết hạn
    if (typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000)
      if (payload.exp <= nowSec) {
        return false // Token đã hết hạn
      }
    }
    return true
  }

  // Nếu chuỗi chứa dấu '.' nhưng không đúng 3 phần -> JWT bị lỗi định dạng
  if (trimmed.includes('.')) {
    return false
  }

  // Đối với token opaque/mock không chứa dấu chấm
  return trimmed.length >= 10
}

function clearAllStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_USER)
    localStorage.removeItem(FALLBACK_KEY_TOKEN)
    localStorage.removeItem(FALLBACK_KEY_USER)

    sessionStorage.removeItem(STORAGE_KEY_TOKEN)
    sessionStorage.removeItem(STORAGE_KEY_USER)
    sessionStorage.removeItem(FALLBACK_KEY_TOKEN)
    sessionStorage.removeItem(FALLBACK_KEY_USER)
  } catch {
    // Tránh crash nếu storage bị trình duyệt chặn
  }
}

/* ──────────── Provider ──────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  /* --- Khôi phục session khi tải lại trang --- */
  useEffect(() => {
    try {
      const token = loadTokenFromStorage()
      const user = loadUserFromStorage()

      if (token && user && isTokenValid(token)) {
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        // Token hoặc user không hợp lệ / hết hạn → dọn dẹp storage
        if (token || user) {
          clearAllStorage()
        }
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } catch {
      // Đảm bảo không bị crash khi đọc session
      clearAllStorage()
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }, [])

  /* --- Login handler --- */
  const login = useCallback((token: string, user: User, rememberMe: boolean = true) => {
    try {
      clearAllStorage()
      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem(STORAGE_KEY_TOKEN, token)
      storage.setItem(STORAGE_KEY_USER, JSON.stringify(user))

      // Đồng thời lưu vào localStorage để đảm bảo reload trang không mất session
      if (!rememberMe) {
        localStorage.setItem(STORAGE_KEY_TOKEN, token)
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
      }
    } catch (err) {
      console.error('Không thể lưu session vào storage:', err)
    }

    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  /* --- Logout handler --- */
  const logout = useCallback(() => {
    clearAllStorage()
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/* ──────────── Hook ──────────── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
