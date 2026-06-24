import React, { useState, useEffect } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Upload, X, Pencil } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FileUploaderProps {
  file?: File | null
  setFile: (file: File | null) => void
  id?: string
  accept?: string
  className?: string
  previewUrl?: string
  canDelete?: boolean
}

const FileUploader: React.FC<FileUploaderProps> = ({
  file, setFile, id = 'upload-file', accept = 'image/*', className, previewUrl, canDelete = true,
}) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const [previewLocalUrl, setPreviewLocalUrl] = useState<string | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null
    if (selected) setFile(selected)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragActive(false)
    const selected = event.dataTransfer.files?.[0] || null
    if (selected) setFile(selected)
  }

  const handleEditFile = () => {
    const input = document.getElementById(id) as HTMLInputElement
    input?.click()
  }

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewLocalUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewLocalUrl(null)
    return undefined
  }, [file])

  return (
    <div className={cn('w-full', className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true) }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed border-primary rounded-xl flex flex-col items-center justify-center cursor-pointer bg-white p-5 transition-colors',
          isDragActive && 'bg-primary/5'
        )}
      >
        {(previewLocalUrl || previewUrl) && (
          <div className="relative rounded-xl overflow-hidden max-w-[300px] mx-auto mb-3">
            <img
              src={previewLocalUrl || previewUrl}
              alt="Preview"
              className="w-full max-h-[200px] object-cover block"
            />
            <button type="button" onClick={handleEditFile} aria-label="Editar arquivo"
              className="absolute top-2 left-2 bg-white/80 hover:bg-white/90 p-1 rounded-full transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            {canDelete && (
              <button type="button" onClick={() => setFile(null)} aria-label="Remover arquivo"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white/90 p-1 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {file && !previewLocalUrl && (
          <div className="bg-gray-100 rounded-lg p-3 my-4 text-center">
            <p className="text-sm text-[#384551] mb-2">Arquivo selecionado: {file.name}</p>
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={handleEditFile} className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <Pencil className="w-3 h-3" /> Editar
              </button>
              <button type="button" onClick={() => setFile(null)} className="flex items-center gap-1 px-3 py-1 border border-red-300 text-red-500 rounded-lg text-sm hover:bg-red-50">
                <X className="w-3 h-3" /> Remover
              </button>
            </div>
          </div>
        )}

        <label htmlFor={id} className="flex cursor-pointer justify-center items-center gap-2">
          <Upload className="w-8 h-8 text-primary" />
          <span className="text-primary text-sm">
            {file ? 'Arraste um novo arquivo aqui ou clique para trocar' : 'Solte ou carregue aqui seu arquivo'}
          </span>
          <input id={id} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
        </label>
      </div>
    </div>
  )
}

export default FileUploader
