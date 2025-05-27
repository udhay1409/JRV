// import { NextResponse } from 'next/server';
// import connectDb from '@/utils/config/connectDB';
// import LogBook from '@/utils/model/logBook/logBookSchema';

// export async function GET(request, { params }) {
//   try {
//     await connectDb();
//     const { logId } = params;
//     console.log("Fetching log entry with ID:", logId); // Debug log
    
//     if (!logId) {
//       return NextResponse.json(
//         { success: false, error: 'Log entry ID is required' },
//         { status: 400 }
//       );
//     }
    
//     const logEntry = await LogBook.findById(logId);
//     console.log("Found log entry:", logEntry); // Debug log
    
//     if (!logEntry) {
//       return NextResponse.json(
//         { success: false, error: 'Log entry not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       data: logEntry
//     });
//   } catch (error) {
//     console.error('Error fetching log entry:', error);
//     return NextResponse.json(
//       { success: false, error: 'Failed to fetch log entry' },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(request, { params }) {
//   try {
//     await connectDb();
//     const { logId } = params;
//     const data = await request.json();
    
//     if (!logId) {
//       return NextResponse.json(
//         { success: false, error: 'Log entry ID is required' },
//         { status: 400 }
//       );
//     }
    
//     const updatedLog = await LogBook.findByIdAndUpdate(
//       logId,
//       data,
//       { new: true, runValidators: true }
//     );

//     if (!updatedLog) {
//       return NextResponse.json(
//         { success: false, error: 'Log entry not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ success: true, data: updatedLog });
//   } catch (error) {
//     console.error('Error updating log entry:', error);
//     return NextResponse.json(
//       { success: false, error: 'Failed to update log entry' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from 'next/server';
import connectDb from '@/utils/config/connectDB';
import LogBook from '@/utils/model/logBook/logBookSchema';
import inventorySchema from '@/utils/model/hotelDb/inventory/inventorySchema';
import { getModel } from '@/utils/helpers/getModel';

export async function GET(request, { params }) {
  try {
    await connectDb();
    const logEntry = await LogBook.findById(params.logid);
    
    if (!logEntry) {
      return NextResponse.json(
        { success: false, error: 'Log entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: logEntry });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch log entry' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDb();
    const { logid } = params;
    const data = await request.json();

    // Get Inventory model
    const Inventory = getModel("Inventory", inventorySchema);

    // Handle damaged/lost items inventory update
    if (data.damageLossSummary && data.damageLossSummary.length > 0) {
      for (const item of data.damageLossSummary) {
        // Find the matching inventory item
        const inventoryItem = await Inventory.findOne({
          category: item.category,
          subCategory: item.subCategory,
          brandName: item.brand,
          model: item.model
        });

        if (inventoryItem) {
          // Calculate new quantity
          const newQuantity = Math.max(0, inventoryItem.quantityInStock - Number(item.quantity));
          
          // Update inventory
          await Inventory.findByIdAndUpdate(
            inventoryItem._id,
            {
              $set: {
                quantityInStock: newQuantity,
                // Update status based on new quantity
                status: newQuantity === 0 ? 'outOfStock' : 
                       newQuantity <= inventoryItem.lowQuantityAlert ? 'lowStock' : 
                       'inStock',
                updatedAt: new Date()
              }
            },
            { new: true, runValidators: true }
          );
        }
      }
    }

    // Calculate grand total
    const grandTotal = (
      (parseFloat(data.totalAmount) || 0) +
      (data.electricityReadings?.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0)) +
      (parseFloat(data.totalRecoveryAmount) || 0)
    );

    // Add grand total to data
    const updatedData = {
      ...data,
      grandTotal,
      status: 'Verified'
    };

    // Update log entry
    const updatedLog = await LogBook.findByIdAndUpdate(
      logid,
      updatedData,
      { new: true }
    );

    if (!updatedLog) {
      return NextResponse.json(
        { success: false, error: 'Log entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedLog,
      message: 'Log entry verified and inventory updated successfully'
    });

  } catch (error) {
    console.error('Error updating log:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: 'Failed to update log entry and inventory'
    });
  }
}