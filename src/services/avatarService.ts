/* ──────────── Avatar Service (S2-03) ──────────── */

export const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024 // 2MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']

export interface AvatarValidationResult {
  isValid: boolean
  error?: string
}

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Kiểm tra tính hợp lệ của file ảnh tải lên
 * - Định dạng: Chỉ chấp nhận JPG/JPEG và PNG
 * - Dung lượng: Tối đa 2MB
 */
export function validateAvatarFile(file: File | null | undefined): AvatarValidationResult {
  if (!file) {
    return {
      isValid: false,
      error: 'Vui lòng chọn một file ảnh.',
    }
  }

  // 1. Kiểm tra định dạng (MIME type và extension)
  const mimeType = (file.type || '').toLowerCase()
  const fileName = (file.name || '').toLowerCase()
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext))
  const hasValidMime = ALLOWED_MIME_TYPES.includes(mimeType)

  if (!hasValidMime && !hasValidExtension) {
    return {
      isValid: false,
      error: 'Chỉ chấp nhận file định dạng JPG hoặc PNG.',
    }
  }

  // 2. Kiểm tra dung lượng (tối đa 2MB)
  if (file.size > MAX_AVATAR_FILE_SIZE) {
    return {
      isValid: false,
      error: 'Dung lượng ảnh vượt quá 2MB. Vui lòng chọn ảnh dung lượng nhỏ hơn.',
    }
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File ảnh rỗng. Vui lòng chọn file ảnh hợp lệ.',
    }
  }

  return { isValid: true }
}

/**
 * Đọc file ảnh dưới dạng Data URL (base64)
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Không thể đọc file ảnh. Vui lòng thử lại.'))
      }
    }
    reader.onerror = () => {
      reject(new Error('Không thể đọc file ảnh. Vui lòng thử lại.'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Cắt ảnh thành hình vuông tỷ lệ 1:1 theo tọa độ và kích thước vùng crop
 * @param img Đối tượng HTMLImageElement đã load xong
 * @param crop Vùng crop { x, y, width, height }
 * @param outputSize Kích thước cạnh hình vuông đầu ra (mặc định 400px)
 */
export function cropImageToSquare(
  img: HTMLImageElement,
  crop: CropArea,
  outputSize = 400
): string {
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Trình duyệt không hỗ trợ Canvas 2D.')
  }

  // Bật chế độ làm mịn ảnh chất lượng cao
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Vẽ phần ảnh đã crop lên canvas hình vuông 1:1
  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize
  )

  return canvas.toDataURL('image/jpeg', 0.92)
}

/**
 * Tạo bản thu nhỏ (thumbnail) từ ảnh đã crop
 * @param sourceDataUrl Data URL của ảnh đã crop
 * @param size Kích thước cạnh thumbnail (mặc định 128px)
 */
export function generateThumbnail(sourceDataUrl: string, size = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return resolve(sourceDataUrl)
        }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => {
      reject(new Error('Không thể tạo bản thu nhỏ (thumbnail).'))
    }
    img.src = sourceDataUrl
  })
}

/* ──────────── Local Storage Persistence ──────────── */

export function getAvatarStorageKey(userId: number | string): string {
  return `user_avatar_${userId}`
}

export function getThumbnailStorageKey(userId: number | string): string {
  return `user_thumbnail_${userId}`
}

/**
 * Lưu avatar vào local storage cho user
 */
export function saveAvatarToStorage(
  userId: number | string,
  avatarDataUrl: string,
  thumbnailDataUrl?: string
): void {
  try {
    localStorage.setItem(getAvatarStorageKey(userId), avatarDataUrl)
    if (thumbnailDataUrl) {
      localStorage.setItem(getThumbnailStorageKey(userId), thumbnailDataUrl)
    }
  } catch {
    // Có thể vượt quota storage nếu file quá lớn
    console.warn('Không thể lưu ảnh vào localStorage do giới hạn bộ nhớ trình duyệt.')
  }
}

/**
 * Lấy avatar từ local storage
 */
export function getAvatarFromStorage(userId: number | string): string | null {
  try {
    return localStorage.getItem(getAvatarStorageKey(userId))
  } catch {
    return null
  }
}

/**
 * Lấy thumbnail từ local storage
 */
export function getThumbnailFromStorage(userId: number | string): string | null {
  try {
    return localStorage.getItem(getThumbnailStorageKey(userId))
  } catch {
    return null
  }
}

/**
 * Xóa avatar khỏi local storage
 */
export function removeAvatarFromStorage(userId: number | string): void {
  try {
    localStorage.removeItem(getAvatarStorageKey(userId))
    localStorage.removeItem(getThumbnailStorageKey(userId))
  } catch {
    // ignore
  }
}
