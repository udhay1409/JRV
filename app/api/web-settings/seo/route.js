import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import { SeoSchema } from "../../../../utils/model/webSettings/SeoSchema";

export async function GET() {
  try {
    await getHotelDatabase();
    const seoData = await SeoSchema.findOne({});
    return NextResponse.json({ success: true, data: seoData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function POST(request) {
  try {
    await getHotelDatabase();
    const body = await request.json();
    const seoData = await SeoSchema.create(body);
    return NextResponse.json({ success: true, data: seoData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function PUT(request) {
  try {
    await getHotelDatabase();
    const body = await request.json();
    const seoData = await SeoSchema.findOne({});
    
    if (seoData) {
      Object.assign(seoData, body);
      await seoData.save();
    } else {
      await SeoSchema.create(body);
    }
    
    return NextResponse.json({ success: true, data: seoData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}