import { NextResponse } from 'next/server';
import connectDb from '@/utils/config/connectDB';
import LogBook from '@/utils/model/logBook/logBookSchema';

// export const dynamic = 'force-dynamic';

// GET handler to fetch all log entries
export async function GET(request) {
  try {
    await connectDb();
    
    // Extract query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;
    
    // Calculate total count for pagination
    const total = await LogBook.countDocuments();
    
    // Fetch log entries with pagination
    const logEntries = await LogBook.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    return NextResponse.json({
      success: true,
      data: logEntries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching log entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch log entries' },
      { status: 500 }
    );
  }
}

// POST handler to add a new log entry
export async function POST(request) {
  try {
    await connectDb();
    
    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.bookingId || !data.customerName || !data.propertyType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate event type only for hall bookings
    if (data.propertyType === 'hall' && !data.eventType) {
      return NextResponse.json(
        { success: false, error: 'Event type is required for hall bookings' },
        { status: 400 }
      );
    }
    
    // Ensure itemsIssued and electricityReadings are valid arrays
    if (!Array.isArray(data.itemsIssued) || data.itemsIssued.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item must be issued' },
        { status: 400 }
      );
    }
    
    // Create a new log entry
    const newLogEntry = new LogBook({
      ...data,
      status: 'Issued', // Default status for new entries
    });
    
    // Save the log entry to the database
    await newLogEntry.save();
    
    return NextResponse.json({
      success: true,
      message: 'Log entry added successfully',
      data: newLogEntry
    });
  } catch (error) {
    console.error('Error adding log entry:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A log entry with this booking ID already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to add log entry' },
      { status: 500 }
    );
  }
}

// PATCH handler to update an existing log entry
export async function PATCH(request) {
  try {
    await connectDb();
    
    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    if (!data._id) {
      return NextResponse.json(
        { success: false, error: 'Log entry ID is required' },
        { status: 400 }
      );
    }
    
    // Find and update the log entry
    const updatedLogEntry = await LogBook.findByIdAndUpdate(
      data._id,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!updatedLogEntry) {
      return NextResponse.json(
        { success: false, error: 'Log entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Log entry updated successfully',
      data: updatedLogEntry
    });
  } catch (error) {
    console.error('Error updating log entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update log entry' },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a log entry
export async function DELETE(request) {
  try {
    await connectDb();
    
    // Extract the log entry ID from the URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Log entry ID is required' },
        { status: 400 }
      );
    }
    
    // Find and delete the log entry
    const deletedLogEntry = await LogBook.findByIdAndDelete(id);
    
    if (!deletedLogEntry) {
      return NextResponse.json(
        { success: false, error: 'Log entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Log entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting log entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete log entry' },
      { status: 500 }
    );
  }
}
