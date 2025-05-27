import { NextResponse } from "next/server"
import connectDb from "@/utils/config/connectDB"
import { CalendarSettings } from "@/utils/model/settings/calendar/calendarSettings"

// Update the isColorAlreadyUsed helper function
const isColorAlreadyUsed = async (CalendarSettings, color, occasionName, occasionId = null) => {
  const settings = await CalendarSettings.findOne()
  if (!settings) return false

  // Find if color is used by any other occasion
  const existingOccasion = settings.occasions.find(occ => 
    occ.color.toUpperCase() === color.toUpperCase() && 
    occ._id.toString() !== occasionId &&
    occ.name !== occasionName // Allow same color for same occasion name
  )

  return !!existingOccasion
}

// Add this helper function to check for date conflicts
const areDatesAvailable = async (CalendarSettings, dates, occasionId = null) => {
  const settings = await CalendarSettings.findOne({
    'occasions': {
      $elemMatch: {
        'dates': { 
          $in: dates.map(date => new Date(date)) 
        },
        ...(occasionId && { '_id': { $ne: occasionId } })
      }
    }
  })

  if (settings) {
    const conflictingOccasion = settings.occasions.find(occ => 
      occ._id.toString() !== occasionId &&
      occ.dates.some(existingDate => 
        dates.some(newDate => 
          new Date(newDate).toDateString() === new Date(existingDate).toDateString()
        )
      )
    )
    
    if (conflictingOccasion) {
      return {
        available: false,
        message: `Date already used for occasion: ${conflictingOccasion.name}`
      }
    }
  }

  return { available: true }
}

// Get all calendar settings
export async function GET() {
  try {
    await connectDb()
    const settings = await CalendarSettings.findOne()
    
    return NextResponse.json({
      success: true,
      data: settings || { occasions: [] }
    })
  } catch (error) {
    console.error("Error fetching calendar settings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch calendar settings" },
      { status: 500 }
    )
  }
}

// Add new occasion
export async function POST(request) {
  try {
    await connectDb()
    const { occasion } = await request.json()

    if (!occasion.name || !occasion.dates || !occasion.color) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if dates are available
    const dateCheck = await areDatesAvailable(CalendarSettings, occasion.dates)
    if (!dateCheck.available) {
      return NextResponse.json(
        { success: false, error: dateCheck.message },
        { status: 400 }
      )
    }

    // Check if color is already used
    const colorExists = await isColorAlreadyUsed(
      CalendarSettings, 
      occasion.color,
      occasion.name
    )
    if (colorExists) {
      return NextResponse.json(
        { success: false, error: `Color ${occasion.color} is already in use by another occasion` },
        { status: 400 }
      )
    }

    let settings = await CalendarSettings.findOne()
    if (!settings) {
      settings = new CalendarSettings({ occasions: [] })
    }

    settings.occasions.push({
      name: occasion.name,
      dates: occasion.dates.map(date => new Date(date)),
      color: occasion.color.toUpperCase() // Changed to uppercase
    })

    await settings.save()
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error("Error saving calendar settings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save calendar settings" },
      { status: 500 }
    )
  }
}

// Update an occasion
export async function PUT(request) {
  try {
    await connectDb()
    const { occasionId, updates } = await request.json()

    if (!updates.name || !updates.dates || !updates.color) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if dates are available (excluding current occasion)
    const dateCheck = await areDatesAvailable(CalendarSettings, updates.dates, occasionId)
    if (!dateCheck.available) {
      return NextResponse.json(
        { success: false, error: dateCheck.message },
        { status: 400 }
      )
    }

    // Check if color is already used by another occasion
    const colorExists = await isColorAlreadyUsed(
      CalendarSettings, 
      updates.color,
      updates.name,
      occasionId
    )
    if (colorExists) {
      return NextResponse.json(
        { success: false, error: `Color ${updates.color} is already in use by another occasion` },
        { status: 400 }
      )
    }

    const settings = await CalendarSettings.findOneAndUpdate(
      { "occasions._id": occasionId },
      {
        $set: {
          "occasions.$.name": updates.name,
          "occasions.$.dates": updates.dates.map(date => new Date(date)),
          "occasions.$.color": updates.color.toUpperCase(), // Changed to uppercase
          "occasions.$.updatedAt": new Date()
        }
      },
      { new: true }
    )

    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Occasion not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error("Error updating occasion:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update occasion" },
      { status: 500 }
    )
  }
}

// Delete an occasion
export async function DELETE(request) {
  try {
    await connectDb()
    const { occasionId } = await request.json()
    
    const settings = await CalendarSettings.findOne()
    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Settings not found" },
        { status: 404 }
      )
    }

    settings.occasions = settings.occasions.filter(
      occasion => occasion._id.toString() !== occasionId
    )

    await settings.save()
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error("Error deleting occasion:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete occasion" },
      { status: 500 }
    )
  }
}