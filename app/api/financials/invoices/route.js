import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import Invoice from "../../../../utils/model/financials/invoices/invoiceSchema";
import FinanceSettings from "../../../../utils/model/settings/finance/invoice/invoiceSettingsSchema";
import RoomSettings from "../../../../utils/model/settings/room/roomSettingsSchema";

import { getModel } from "../../../../utils/helpers/getModel";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await getHotelDatabase();
    const InvoiceModel = getModel("Invoice", Invoice);
    const FinanceSettingsModel = getModel("FinanceSettings", FinanceSettings);
    const RoomSettingsModel = getModel("RoomSettings", RoomSettings);

    // Get finance settings
    const settings = await FinanceSettingsModel.findOne({});
    const roomSettings = await RoomSettingsModel.findOne({});

    const styleSettings = {
      color: settings?.color || "#00569B",
      logo: settings?.logo || {}
    };

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const invoiceNumber = searchParams.get("invoiceNumber");
    const bookingNumber = searchParams.get("bookingNumber");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const customerEmail = searchParams.get("email");

    // Build query
    const query = {};
    if (invoiceNumber) query.invoiceNumber = invoiceNumber;
    if (bookingNumber) query.bookingNumber = bookingNumber;
    if (customerEmail) query["customerDetails.email"] = customerEmail;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const invoices = await InvoiceModel.find(query).sort({ createdAt: -1 });

    // Add style settings to each invoice
    const invoicesWithStyle = invoices.map(invoice => ({
      ...invoice.toObject(),
      style: styleSettings,
      roomSettings: roomSettings

    }));

    return NextResponse.json({ 
      success: true, 
      invoices: invoicesWithStyle,
      settings: styleSettings,
      roomSettings: roomSettings

    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await getHotelDatabase();
    const InvoiceModel = getModel("Invoice", Invoice);
    
    const body = await request.json();
    const invoice = await InvoiceModel.create(body);

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await getHotelDatabase();
    const InvoiceModel = getModel("Invoice", Invoice);
    
    const body = await request.json();
    const { invoiceId, ...updateData } = body;

    const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
      invoiceId,
      updateData,
      { new: true }
    );

    if (!updatedInvoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await getHotelDatabase();
    const InvoiceModel = getModel("Invoice", Invoice);

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("id");

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const deletedInvoice = await InvoiceModel.findByIdAndDelete(invoiceId);

    if (!deletedInvoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, invoice: deletedInvoice });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
