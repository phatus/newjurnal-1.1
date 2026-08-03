'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Loader2, Trash2, Image as ImageIcon, Settings } from 'lucide-react'
import { updateAvatarOnly } from '@/app/auth/actions'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ProfileAvatarProps {
    uid: string
    url?: string | null
    name?: string
    email?: string
}

export default function ProfileAvatar({ uid, url, name, email }: ProfileAvatarProps) {
    const router = useRouter()
    const [uploading, setUploading] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(url || null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Sync previewUrl if url prop changes externally
    useEffect(() => {
        setPreviewUrl(url || null)
    }, [url])

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            setShowMenu(false)

            if (!event.target.files || event.target.files.length === 0) {
                return
            }

            const file = event.target.files[0]
            const uploadData = new FormData()
            uploadData.append('file', file)

            const uploadRes = await fetch('/api/upload/avatar', {
                method: 'POST',
                body: uploadData
            })

            if (!uploadRes.ok) {
                const errData = await uploadRes.json()
                throw new Error(errData.error || 'Gagal mengunggah file ke server.')
            }

            const { url: newUrl } = await uploadRes.json()

            // Set local state for instant feedback
            setPreviewUrl(newUrl)

            await updateAvatarOnly(newUrl)

            // Force a refresh to update all components relying on server state
            router.refresh()

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Upload Error:', error)
            toast.error('Gagal mengunggah foto: ' + errorMessage)
            // Rollback preview on error
            setPreviewUrl(url || null)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Apakah Anda yakin ingin menghapus foto profil?')) return

        try {
            setUploading(true)
            setShowMenu(false)
            setPreviewUrl(null)
            await updateAvatarOnly('')
            router.refresh()
            toast.success('Foto profil berhasil dihapus');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast.error('Gagal menghapus foto: ' + errorMessage)
            setPreviewUrl(url || null)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="relative group">
            <div
                className="h-32 w-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl relative cursor-pointer overflow-hidden group/avatar"
                onClick={() => setShowMenu(!showMenu)}
            >
                <Image
                    src={previewUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || email || 'user'}`}
                    alt="Avatar"
                    width={128}
                    height={128}
                    className={cn(
                        "h-full w-full object-cover rounded-[2rem] transition-all duration-500",
                        uploading ? "opacity-30 blur-sm" : "group-hover/avatar:scale-110"
                    )}
                    unoptimized
                />

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                    </div>
                )}

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <Settings className="text-white h-6 w-6" />
                </div>
            </div>

            {/* Popup Menu */}
            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute top-full left-0 mt-4 w-56 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 py-3 z-[100] animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-2 mb-2 border-b border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opsi Foto Profil</p>
                        </div>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-slate-700 transition-colors group/item"
                        >
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                <ImageIcon size={18} />
                            </div>
                            <span className="text-sm font-bold">Ganti Foto</span>
                        </button>

                        <button
                            onClick={handleDelete}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 text-red-500 transition-colors group/item"
                        >
                            <div className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                <Trash2 size={18} />
                            </div>
                            <span className="text-sm font-bold">Hapus Foto</span>
                        </button>

                        <div className="h-px bg-slate-50 my-2 mx-4" />

                        <div className="px-4 py-2">
                            <p className="text-[9px] font-medium text-slate-300 leading-tight italic">Maksimal 2MB (JPG, PNG, GIF)</p>
                        </div>
                    </div>
                </>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
            />
        </div>
    )
}
