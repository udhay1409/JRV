import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import { getWebSettings } from "../../../utils/model/webSettings/WebSettingsSchema";
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    await getHotelDatabase();
    const settings = await getWebSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

 export async function POST(request) {
  try {
    await getHotelDatabase();
    const settings = await getWebSettings();
    const data = await request.json();

    if (data.heroSection) {
      // Handle base64 image if present
      if (data.heroSection.image && data.heroSection.image.startsWith('data:image')) {
        const base64Data = data.heroSection.image.split(';base64,').pop();
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const fileName = `hero-${Date.now()}.jpg`;
        
        // Create directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'web-settings');
        await mkdir(uploadDir, { recursive: true });
        
        // Save image
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, imageBuffer);
        
        // Update image path in data
        data.heroSection.image = `/uploads/web-settings/${fileName}`;
      }
      
      settings.heroSections.push(data.heroSection);
    }

    await settings.save();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await getHotelDatabase();
    const settings = await getWebSettings();
    const data = await request.json();

    if (data.heroSectionId && data.heroSection) {
      const index = settings.heroSections.findIndex(h => h._id.toString() === data.heroSectionId);
      if (index !== -1) {
        // Handle base64 image if present
        if (data.heroSection.image && data.heroSection.image.startsWith('data:image')) {
          const base64Data = data.heroSection.image.split(';base64,').pop();
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const fileName = `hero-${Date.now()}.jpg`;
          
          // Create directory if it doesn't exist
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'web-settings');
          await mkdir(uploadDir, { recursive: true });
          
          // Save image
          const filePath = path.join(uploadDir, fileName);
          await writeFile(filePath, imageBuffer);
          
          // Update image path in data
          data.heroSection.image = `/uploads/web-settings/${fileName}`;
        }
        
        settings.heroSections[index] = { 
          ...settings.heroSections[index], 
          ...data.heroSection 
        };
      }
    }

    await settings.save();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await getHotelDatabase();
    const settings = await getWebSettings();
    const { searchParams } = new URL(request.url);
    const heroSectionId = searchParams.get('heroSectionId');

    if (heroSectionId) {
      settings.heroSections = settings.heroSections.filter(h => h._id.toString() !== heroSectionId);
      await settings.save();
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}