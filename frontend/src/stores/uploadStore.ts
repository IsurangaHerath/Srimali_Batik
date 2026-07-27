import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ImageUploadState {
  isUploading: boolean
  progress: number
  upload: (file: File) => Promise<string>
  reset: () => void
}

export const useImageUpload = create<ImageUploadState>()(
  persist(
    (set) => ({
      isUploading: false,
      progress: 0,
      upload: async (file: File) => {
        set({ isUploading: true, progress: 0 })
        const formData = new FormData()
        formData.append('image', file)
        
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('srimali-auth-token')}`,
          },
          body: formData,
        })

        if (!response.ok) throw new Error('Upload failed')
        
        const data = await response.json()
        set({ isUploading: false, progress: 100 })
        return data.url
      },
      reset: () => set({ isUploading: false, progress: 0 }),
    }),
    { name: 'image-upload-storage' }
  )
)