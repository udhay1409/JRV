import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import inventorySchema from "../../../utils/model/hotelDb/inventory/inventorySchema";
import { getModel } from "../../../utils/helpers/getModel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await getHotelDatabase();
    const Inventory = getModel("Inventory", inventorySchema);
    
    const inventory = await Inventory.find({});
    return NextResponse.json({ success: true, data: inventory });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await getHotelDatabase();
    const Inventory = getModel("Inventory", inventorySchema);
    const body = await req.json();
    
    const newItem = new Inventory({
      supplierName: body.supplierName,
      category: body.category,
      subCategory: body.subCategory,
      brandName: body.brandName,
      model: body.model,
      price: body.price,
      gst: body.gst,
      quantityInStock: body.quantityInStock,
      status: body.status,
      lowQuantityAlert: body.lowQuantityAlert,
      description: body.description
    });

    await newItem.save();
    return NextResponse.json({ 
      success: true, 
      message: "Item added successfully",
      data: newItem
    });
  } catch (error) {
    console.error("Inventory creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
