import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../../utils/config/hotelConnection";
import ComplementarySettings from "../../../../../utils/model/settings/inventory/complementarySchema.js";
import Room from "../../../../../utils/model/room/roomSchema";
import { getModel } from "../../../../../utils/helpers/getModel";

export async function GET() {
  try {
    await getHotelDatabase();
    const ComplementaryModel = getModel("ComplementarySettings", ComplementarySettings);
    const RoomModel = getModel("Room", Room);
    
    const settings = await ComplementaryModel.findOne({})
      .populate({
        path: 'items.roomCategory',
        model: RoomModel,
        select: 'name'
      });
      
    return NextResponse.json({
      success: true,
      settings: settings || { items: [] }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await getHotelDatabase();
    const ComplementaryModel = getModel("ComplementarySettings", ComplementarySettings);
    const RoomModel = getModel("Room", Room);
    
    const { roomCategory, category, subCategory, brandName, quantity } = await request.json();
    
    let settings = await ComplementaryModel.findOne({}) || new ComplementaryModel({});
    
    settings.items.push({
      roomCategory,
      category,
      subCategory,
      brandName,
      quantity
    });
    
    await settings.save();
    
    // Fetch the saved settings with populated room data
    const savedSettings = await ComplementaryModel.findById(settings._id)
      .populate({
        path: 'items.roomCategory',
        model: RoomModel,
        select: 'name'
      });
    
    return NextResponse.json({ 
      success: true, 
      settings: savedSettings 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await getHotelDatabase();
    const ComplementaryModel = getModel("ComplementarySettings", ComplementarySettings);
    const RoomModel = getModel("Room", Room);
    
    const { id, data } = await request.json();
    const settings = await ComplementaryModel.findOne({});
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        message: "Settings not found"
      }, { status: 404 });
    }
    
    const item = settings.items.id(id);
    if (item) {
      Object.assign(item, data);
      await settings.save();
      
      // Fetch updated settings with populated room data
      const updatedSettings = await ComplementaryModel.findById(settings._id)
        .populate({
          path: 'items.roomCategory',
          model: RoomModel,
          select: 'name'
        });
      
      return NextResponse.json({ 
        success: true, 
        settings: updatedSettings 
      }, { status: 200 });
    }
    
    return NextResponse.json({
      success: false,
      message: "Item not found"
    }, { status: 404 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await getHotelDatabase();
    const ComplementaryModel = getModel("ComplementarySettings", ComplementarySettings);
    
    const { id } = await request.json();
    const settings = await ComplementaryModel.findOne({});
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        message: "Settings not found"
      }, { status: 404 });
    }
    
    settings.items.pull(id);
    await settings.save();
    
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
