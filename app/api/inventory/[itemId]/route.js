import { getHotelDatabase } from "@/utils/config/hotelConnection";
import inventorySchema from "../../../../utils/model/hotelDb/inventory/inventorySchema";
import { getModel } from "../../../../utils/helpers/getModel";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { itemId } = params;
  
  try {
    await getHotelDatabase();
    const Inventory = getModel("Inventory", inventorySchema);
    
    const item = await Inventory.findById(itemId);
    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { itemId } = params;
  
  try {
    await getHotelDatabase();
    const Inventory = getModel("Inventory", inventorySchema);
    const body = await req.json();
    
    const updatedItem = await Inventory.findByIdAndUpdate(
      itemId,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Item updated successfully",
      data: updatedItem 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const { itemId } = params;
  
  try {
    await getHotelDatabase();
    const Inventory = getModel("Inventory", inventorySchema);
    
    const deletedItem = await Inventory.findByIdAndDelete(itemId);

    if (!deletedItem) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Item deleted successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
