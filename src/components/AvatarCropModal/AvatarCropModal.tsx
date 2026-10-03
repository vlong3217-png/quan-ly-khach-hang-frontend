import { useState, useRef, useEffect, useCallback, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent, type ChangeEvent } from 'react'
import {
  validateAvatarFile,
  readFileAsDataUrl,
} from '../../services/avatarService.ts'
import './AvatarCropModal.css'

/* ──────────── Icons ──────────── */
const IconCrop = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2v14a2 2 0 0 0 2 2h14" />
    <path d="M18 22V8a2 2 0 0 0-2-2H2" />
  </svg>
)

const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconUpload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const CROP_BOX_SIZE = 320 // 320px x 320px 1:1 square crop area

export interface AvatarCropModalProps {
  isOpen: boolean
  initialImageSrc: string
  onClose: () => void
  onSave: (croppedDataUrl: string, thumbnailDataUrl: string) => Promise<void> | void
  isSaving?: boolean
}

export function AvatarCropModal({
  isOpen,
  initialImageSrc,
  onClose,
  onSave,
  isSaving = false,
}: AvatarCropModalProps) {
  const [imageSrc, setImageSrc] = useState(initialImageSrc)
  const [zoomFactor, setZoomFactor] = useState(1) // 1x to 3x
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const imgRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Cập nhật imageSrc khi prop thay đổi
  useEffect(() => {
    setImageSrc(initialImageSrc)
    setZoomFactor(1)
    setPan({ x: 0, y: 0 })
    setModalError(null)
    setIsImageLoaded(false)
  }, [initialImageSrc, isOpen])

  // Giới hạn vùng pan để ảnh luôn lấp đầy khung 1:1
  const clampPan = useCallback(
    (nextPanX: number, nextPanY: number, factor: number) => {
      const img = imgRef.current
      if (!img || !img.naturalWidth || !img.naturalHeight) {
        return { x: nextPanX, y: nextPanY }
      }
      const initialScale = Math.max(
        CROP_BOX_SIZE / img.naturalWidth,
        CROP_BOX_SIZE / img.naturalHeight
      )
      const currentScale = initialScale * factor
      const displayedW = img.naturalWidth * currentScale
      const displayedH = img.naturalHeight * currentScale

      const maxPanX = Math.max(0, (displayedW - CROP_BOX_SIZE) / 2)
      const maxPanY = Math.max(0, (displayedH - CROP_BOX_SIZE) / 2)

      return {
        x: Math.min(maxPanX, Math.max(-maxPanX, nextPanX)),
        y: Math.min(maxPanY, Math.max(-maxPanY, nextPanY)),
      }
    },
    []
  )

  // Vẽ preview canvas khi pan/zoom thay đổi
  const updatePreviewCanvas = useCallback(() => {
    const img = imgRef.current
    const canvas = previewCanvasRef.current
    if (!img || !canvas || !img.naturalWidth || !img.naturalHeight) return

    const initialScale = Math.max(
      CROP_BOX_SIZE / img.naturalWidth,
      CROP_BOX_SIZE / img.naturalHeight
    )
    const currentScale = initialScale * zoomFactor

    // Tính tọa độ cắt trên ảnh gốc
    const centerSourceX = img.naturalWidth / 2 - pan.x / currentScale
    const centerSourceY = img.naturalHeight / 2 - pan.y / currentScale
    const sourceCropSize = CROP_BOX_SIZE / currentScale

    const sx = Math.max(0, centerSourceX - sourceCropSize / 2)
    const sy = Math.max(0, centerSourceY - sourceCropSize / 2)
    const sWidth = Math.min(img.naturalWidth - sx, sourceCropSize)
    const sHeight = Math.min(img.naturalHeight - sy, sourceCropSize)

    canvas.width = 240
    canvas.height = 240
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, 240, 240)
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 240, 240)
  }, [pan, zoomFactor])

  useEffect(() => {
    if (isImageLoaded) {
      updatePreviewCanvas()
    }
  }, [isImageLoaded, pan, zoomFactor, updatePreviewCanvas])

  // Xử lý khi ảnh load xong
  const handleImageLoad = () => {
    setIsImageLoaded(true)
    setZoomFactor(1)
    setPan({ x: 0, y: 0 })
  }

  // Đổi zoom bằng slider
  const handleZoomChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFactor = parseFloat(e.target.value)
    setZoomFactor(newFactor)
    setPan((prev) => clampPan(prev.x, prev.y, newFactor))
  }

  // Nút zoom in / out
  const handleZoomStep = (delta: number) => {
    setZoomFactor((prev) => {
      const next = Math.min(3, Math.max(1, +(prev + delta).toFixed(2)))
      setPan((currPan) => clampPan(currPan.x, currPan.y, next))
      return next
    })
  }

  // Đặt lại vị trí ban đầu
  const handleReset = () => {
    setZoomFactor(1)
    setPan({ x: 0, y: 0 })
  }

  // Bắt đầu kéo chuột
  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
  }

  // Di chuyển chuột khi kéo
  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.mouseX
    const dy = e.clientY - dragStartRef.current.mouseY
    const nextPan = clampPan(
      dragStartRef.current.panX + dx,
      dragStartRef.current.panY + dy,
      zoomFactor
    )
    setPan(nextPan)
  }

  // Dừng kéo chuột
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Xử lý touch trên mobile/tablet
  const handleTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      dragStartRef.current = {
        mouseX: e.touches[0].clientX,
        mouseY: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y,
      }
    }
  }

  const handleTouchMove = (e: ReactTouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - dragStartRef.current.mouseX
    const dy = e.touches[0].clientY - dragStartRef.current.mouseY
    const nextPan = clampPan(
      dragStartRef.current.panX + dx,
      dragStartRef.current.panY + dy,
      zoomFactor
    )
    setPan(nextPan)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Xử lý chọn ảnh khác từ máy tính ngay trong modal
  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setModalError(null)
    const check = validateAvatarFile(file)
    if (!check.isValid) {
      setModalError(check.error || 'File ảnh không hợp lệ.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setImageSrc(dataUrl)
      setZoomFactor(1)
      setPan({ x: 0, y: 0 })
    } catch {
      setModalError('Không thể đọc file ảnh mới. Vui lòng thử lại.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Xuất ảnh vuông 1:1 và thumbnail rồi gọi onSave
  const handleConfirmSave = async () => {
    const img = imgRef.current
    if (!img || !img.naturalWidth || !img.naturalHeight) {
      setModalError('Lỗi xử lý ảnh: không tìm thấy nguồn ảnh.')
      return
    }

    try {
      const initialScale = Math.max(
        CROP_BOX_SIZE / img.naturalWidth,
        CROP_BOX_SIZE / img.naturalHeight
      )
      const currentScale = initialScale * zoomFactor

      const centerSourceX = img.naturalWidth / 2 - pan.x / currentScale
      const centerSourceY = img.naturalHeight / 2 - pan.y / currentScale
      const sourceCropSize = CROP_BOX_SIZE / currentScale

      const sx = Math.max(0, centerSourceX - sourceCropSize / 2)
      const sy = Math.max(0, centerSourceY - sourceCropSize / 2)
      const sWidth = Math.min(img.naturalWidth - sx, sourceCropSize)
      const sHeight = Math.min(img.naturalHeight - sy, sourceCropSize)

      // 1. Tạo bản ảnh vuông chuẩn 400x400
      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = 400
      outputCanvas.height = 400
      const outCtx = outputCanvas.getContext('2d')
      if (!outCtx) throw new Error('Không thể khởi tạo Canvas.')

      outCtx.imageSmoothingEnabled = true
      outCtx.imageSmoothingQuality = 'high'
      outCtx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 400, 400)
      const croppedAvatarUrl = outputCanvas.toDataURL('image/jpeg', 0.92)

      // 2. Tạo bản thu nhỏ thumbnail 128x128
      const thumbCanvas = document.createElement('canvas')
      thumbCanvas.width = 128
      thumbCanvas.height = 128
      const thumbCtx = thumbCanvas.getContext('2d')
      if (!thumbCtx) throw new Error('Không thể tạo Thumbnail.')

      thumbCtx.imageSmoothingEnabled = true
      thumbCtx.imageSmoothingQuality = 'high'
      thumbCtx.drawImage(outputCanvas, 0, 0, 128, 128)
      const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.88)

      await onSave(croppedAvatarUrl, thumbnailUrl)
    } catch (err) {
      const error = err as Error
      setModalError(error.message || 'Lỗi khi xử lý crop ảnh.')
    }
  }

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, onClose])

  if (!isOpen) return null

  // Tính transform cho ảnh hiển thị trong crop box
  const img = imgRef.current
  let displayScale = 1
  if (img && img.naturalWidth && img.naturalHeight) {
    const initialScale = Math.max(
      CROP_BOX_SIZE / img.naturalWidth,
      CROP_BOX_SIZE / img.naturalHeight
    )
    displayScale = initialScale * zoomFactor
  }

  return (
    <div
      className="crop-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
    >
      <div className="crop-modal-container">
        {/* Header */}
        <div className="crop-modal-header">
          <div className="crop-modal-title-wrap">
            <div className="crop-modal-icon-badge" aria-hidden="true">
              <IconCrop />
            </div>
            <div>
              <h2 className="crop-modal-title" id="crop-modal-title">
                Cắt ảnh đại diện
              </h2>
              <p className="crop-modal-subtitle">
                Điều chỉnh vị trí và kích thước để ảnh được cắt thành hình vuông tỷ lệ 1:1
              </p>
            </div>
          </div>
          <button
            type="button"
            className="crop-modal-close-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Đóng cửa sổ cắt ảnh"
            id="crop-modal-close-btn"
          >
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="crop-modal-body">
          {/* Cột trái: Vùng tương tác cắt ảnh */}
          <div className="crop-workspace">
            {modalError && (
              <div className="crop-modal-error" role="alert">
                <IconAlert />
                <span>{modalError}</span>
              </div>
            )}

            <div
              className={`crop-canvas-wrapper ${isDragging ? 'is-dragging' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              id="crop-interactive-viewport"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Nguồn ảnh cắt"
                className="crop-image-element"
                onLoad={handleImageLoad}
                style={{
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${displayScale})`,
                }}
              />

              {/* Lưới Rule-of-thirds và viền 1:1 */}
              <div className="crop-grid-lines">
                <div className="crop-grid-line-v1 crop-grid-line-h1" />
                <div className="crop-grid-line-v2 crop-grid-line-h1" />
                <div className="crop-grid-line-h1" />
                <div className="crop-grid-line-v1 crop-grid-line-h2" />
                <div className="crop-grid-line-v2 crop-grid-line-h2" />
                <div className="crop-grid-line-h2" />
                <div className="crop-grid-line-v1" />
                <div className="crop-grid-line-v2" />
                <div />
              </div>

              {/* Vòng tròn gợi ý hiển thị avatar */}
              <div className="crop-mask-circle-guide" />
              <div className="crop-mask-overlay" />
              <div className="crop-hint-badge">Kéo ảnh để chỉnh vị trí</div>
            </div>

            {/* Thanh điều khiển Zoom */}
            <div className="crop-controls-bar">
              <button
                type="button"
                className="crop-control-btn"
                onClick={() => handleZoomStep(-0.2)}
                disabled={zoomFactor <= 1 || isSaving}
                title="Thu nhỏ"
                id="crop-zoom-out-btn"
              >
                −
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.02"
                value={zoomFactor}
                onChange={handleZoomChange}
                disabled={isSaving}
                className="crop-slider"
                aria-label="Thu phóng ảnh"
                id="crop-zoom-slider"
              />
              <button
                type="button"
                className="crop-control-btn"
                onClick={() => handleZoomStep(0.2)}
                disabled={zoomFactor >= 3 || isSaving}
                title="Phóng to"
                id="crop-zoom-in-btn"
              >
                +
              </button>
              <button
                type="button"
                className="crop-reset-btn"
                onClick={handleReset}
                disabled={isSaving}
                title="Căn giữa lại ảnh"
                id="crop-reset-pos-btn"
              >
                Đặt lại
              </button>
            </div>
          </div>

          {/* Cột phải: Xem trước kết quả */}
          <div className="crop-preview-panel">
            <h3 className="crop-preview-title">Xem trước kết quả</h3>

            {/* Preview hình tròn lớn */}
            <div className="crop-preview-item">
              <div className="crop-preview-circle-wrap">
                <canvas ref={previewCanvasRef} className="crop-preview-canvas" />
              </div>
              <span className="crop-preview-label">Ảnh đại diện hồ sơ (Tròn)</span>
            </div>

            {/* Preview hình vuông & thumbnail */}
            <div className="crop-preview-thumbnails-row">
              <div className="crop-preview-item" style={{ marginBottom: 0 }}>
                <div className="crop-preview-square-wrap">
                  <canvas
                    width="64"
                    height="64"
                    ref={(canvas) => {
                      if (canvas && previewCanvasRef.current) {
                        const ctx = canvas.getContext('2d')
                        if (ctx) ctx.drawImage(previewCanvasRef.current, 0, 0, 64, 64)
                      }
                    }}
                    className="crop-preview-canvas"
                  />
                </div>
                <span className="crop-preview-label">Vuông (1:1)</span>
              </div>

              <div className="crop-preview-item" style={{ marginBottom: 0 }}>
                <div className="crop-preview-thumb-wrap">
                  <canvas
                    width="36"
                    height="36"
                    ref={(canvas) => {
                      if (canvas && previewCanvasRef.current) {
                        const ctx = canvas.getContext('2d')
                        if (ctx) ctx.drawImage(previewCanvasRef.current, 0, 0, 36, 36)
                      }
                    }}
                    className="crop-preview-canvas"
                  />
                </div>
                <span className="crop-preview-label">Thumbnail</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="crop-modal-footer">
          <div className="crop-modal-footer-left">
            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
              id="crop-modal-file-input"
            />
            <button
              type="button"
              className="crop-btn-change-file"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
              id="crop-change-file-btn"
            >
              <IconUpload />
              <span>Chọn ảnh khác</span>
            </button>
          </div>

          <div className="crop-modal-footer-right">
            <button
              type="button"
              className="crop-btn-cancel"
              onClick={onClose}
              disabled={isSaving}
              id="crop-cancel-btn"
            >
              Hủy
            </button>
            <button
              type="button"
              className="crop-btn-save"
              onClick={handleConfirmSave}
              disabled={isSaving || !isImageLoaded}
              id="crop-save-btn"
            >
              {isSaving ? (
                <>
                  <span className="crop-spinner" aria-hidden="true" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <IconCheck />
                  <span>Xác nhận & Lưu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarCropModal
