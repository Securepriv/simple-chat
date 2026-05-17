'use client'
import { useState, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store'
import type { UploadedFile, MessageType } from '@/types'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED: Record<string, MessageType> = {
  'image/png': 'image', 'image/jpeg': 'image', 'image/gif': 'image', 'image/webp': 'image',
  'application/pdf': 'file',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file',
  'text/plain': 'file', 'application/zip': 'file',
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { user } = useAuthStore()
  const supabase = getSupabaseClient()

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile> => {
    if (!user) throw new Error('Non authentifié')
    if (file.size > MAX_SIZE) throw new Error('Fichier trop volumineux (max 10 MB)')
    if (!ALLOWED[file.type]) throw new Error(`Type non autorisé: ${file.type}`)

    setUploading(true)
    setProgress(0)

    try {
      const ext = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (error) throw error
      setProgress(100)

      // ✅ Gestion du cas null
      const { data: signedData, error: signedError } = await supabase.storage
        .from('chat-files')
        .createSignedUrl(data.path, 3600)

      if (signedError) throw signedError
      if (!signedData) throw new Error('Impossible de générer le lien signé')

      return {
        url: signedData.signedUrl,
        name: file.name,
        size: file.size,
        type: file.type
      }
    } finally {
      setUploading(false)
    }
  }, [user]) // eslint-disable-line

  const getMessageType = (fileType: string): MessageType => ALLOWED[fileType] || 'file'

  return { uploadFile, getMessageType, uploading, progress }
}
