
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Try to use Replit Object Storage, fallback to local storage
    try {
      const { Client } = await import('@replit/object-storage');
      const client = new Client();
      
      // Generate unique filename
      const fileName = `${Date.now()}-${file.name}`;
      
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Upload to Object Storage
      const result = await client.uploadFromBuffer(fileName, buffer);
      
      if (result && result.url) {
        return NextResponse.json({ imageUrl: result.url }, { status: 200 });
      }
      
      // If no direct URL, construct it
      const imageUrl = `https://objectstorage.replit.com/${fileName}`;
      return NextResponse.json({ imageUrl }, { status: 200 });
      
    } catch (objectStorageError) {
      console.log('Object Storage not available, falling back to local storage:', objectStorageError.message);
      
      // Fallback to local file storage
      const fs = await import('fs');
      const path = await import('path');
      
      const fileName = `${Date.now()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Save file locally
      const filePath = path.join(uploadDir, fileName);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(filePath, buffer);
      
      // Return local URL
      const imageUrl = `/uploads/${fileName}`;
      return NextResponse.json({ imageUrl }, { status: 200 });
    }
    
  } catch (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: uploadError.message 
    }, { status: 500 });
  }
}
