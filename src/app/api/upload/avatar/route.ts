import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const fileExt = file.name.split('.').pop()
        const filename = `${session.user.id}-${Date.now()}.${fileExt}`
        
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }

        const filePath = path.join(uploadDir, filename)
        fs.writeFileSync(filePath, buffer)

        const publicUrl = `/uploads/avatars/${filename}`
        return NextResponse.json({ url: publicUrl })
    } catch (err: any) {
        console.error('Upload API Error:', err)
        return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
    }
}
