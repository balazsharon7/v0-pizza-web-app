'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Upload, RotateCcw } from 'lucide-react'

interface ImageUploadFieldProps {
  label: string
  /** Current custom value (blob URL) or empty string when using the default. */
  value: string
  /** The static default image shown when no custom value is set. */
  defaultSrc: string
  onChange: (url: string) => void
  locale: string
  /** Blob destination folder, e.g. "about". */
  folder?: string
}

export function ImageUploadField({
  label,
  value,
  defaultSrc,
  onChange,
  locale,
  folder = 'about',
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const currentSrc = value || defaultSrc
  const isCustom = Boolean(value)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset the input so re-selecting the same file still fires onChange.
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error(locale === 'hu' ? 'Érvénytelen fájltípus' : 'Invalid file type')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(locale === 'hu' ? 'A fájl túl nagy (max 5MB)' : 'File too large (max 5MB)')
      return
    }

    setIsUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', folder)

      const response = await fetch('/api/upload', { method: 'POST', body })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }

      const { url } = await response.json()
      onChange(url)
      toast.success(locale === 'hu' ? 'Kép feltöltve!' : 'Image uploaded!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(locale === 'hu' ? 'Feltöltési hiba' : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">{label}</Label>
        {isCustom && (
          <span className="text-xs text-primary">
            {locale === 'hu' ? 'Egyéni kép' : 'Custom image'}
          </span>
        )}
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted">
        <Image
          src={currentSrc}
          alt={label}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover"
        />
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Spinner className="h-6 w-6" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
        disabled={isUploading}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {locale === 'hu' ? 'Kép cseréje' : 'Change image'}
        </Button>
        {isCustom && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            disabled={isUploading}
            title={locale === 'hu' ? 'Alapértelmezett visszaállítása' : 'Reset to default'}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
