import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';
import { GallerySchema } from "../../../../utils/model/webSettings/GallerySchema";

export async function POST(request) {
  try {
    await getHotelDatabase();
    const formData = await request.formData();
    const images = formData.getAll('images');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'gallery');
    await mkdir(uploadDir, { recursive: true });

    const savedImages = [];
    for (const image of images) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `gallery-${Date.now()}-${image.name}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      const galleryImage = new GallerySchema({
        url: `/uploads/gallery/${fileName}`,
        name: image.name
      });
      await galleryImage.save();
      savedImages.push(galleryImage);
    }

    return NextResponse.json({ success: true, images: savedImages });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await getHotelDatabase();
    const images = await GallerySchema.find().sort({ createdAt: -1 });
    return NextResponse.json(images);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await getHotelDatabase();
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('id');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const image = await GallerySchema.findById(imageId);
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete file first
    const filePath = path.join(process.cwd(), 'public', image.url);
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await GallerySchema.findByIdAndDelete(imageId);

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}