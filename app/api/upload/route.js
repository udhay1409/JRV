
import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@replit/object-storage';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Initialize Replit Object Storage client
    const client = new Client();
    
    // Generate unique filename
    const fileName = `${Date.now()}-${file.name}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Object Storage
    const { ok, error } = await client.uploadFromBuffer(fileName, buffer);
    
    if (!ok) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: 'Upload failed', details: error }, { status: 500 });
    }
    
    // Generate the public URL (adjust based on your Object Storage configuration)
    const imageUrl = `https://your-bucket-id.objectstorage.replit.com/${fileName}`;
    
    return NextResponse.json({ imageUrl }, { status: 200 });
    
  } catch (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 });
  }
}
