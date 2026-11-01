import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'receipts';

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada berkas yang diunggah' }, { status: 400 });
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validMimes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
      return NextResponse.json({ error: 'Format berkas harus gambar (JPG, PNG, WebP)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // In local environments, try writing to public/uploads
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', category);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(file.name) || '.png';
      const filename = `${category}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${category}/${filename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename,
      });
    } catch {
      // In serverless / read-only environments (e.g. Vercel), fallback to Data URI
      const mime = file.type || 'image/jpeg';
      const base64 = buffer.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUri,
        filename: file.name,
      });
    }
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Gagal mengunggah berkas' }, { status: 500 });
  }
}
