import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please select an image file', variant: 'destructive' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum size is 5MB', variant: 'destructive' })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const token = localStorage.getItem('srimali-auth-token')
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Upload failed')
      onChange(json.data.url)
      setPreview(json.data.url)
      toast({ title: 'Image uploaded', variant: 'success' })
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const clearImage = () => {
    onChange('')
    setPreview(null)
  }

  const hasImage = value || preview

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors min-h-[140px]',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
          isUploading && 'pointer-events-none opacity-60',
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-text-secondary">Uploading...</span>
          </div>
        ) : hasImage ? (
          <div className="relative w-full h-32" onClick={(e) => e.stopPropagation()}>
            <img
              src={hasImage}
              alt="Preview"
              className="w-full h-full object-contain rounded-lg"
            />
            <button
              onClick={(e) => { e.stopPropagation(); clearImage() }}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-accent text-white shadow-md hover:bg-accent/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <div className="p-3 rounded-full bg-muted">
              <Upload className="h-6 w-6 text-text-secondary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Drop image here or click to browse</p>
              <p className="text-xs text-text-muted mt-0.5">JPG, PNG or WebP up to 5MB</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {!hasImage && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted">or paste URL</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value); setPreview(e.target.value) }}
            placeholder="/uploads/image.jpg"
            className="w-full h-9 rounded-lg border border-border bg-surface px-3 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
          {value && (
            <button
              onClick={clearImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="shrink-0 gap-1.5"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Browse
        </Button>
      </div>
    </div>
  )
}