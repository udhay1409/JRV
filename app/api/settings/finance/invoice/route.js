import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../../utils/config/hotelConnection";
import FinanceSettings from "../../../../../utils/model/settings/finance/invoice/invoiceSettingsSchema";
import { updateFinancialYearIfExpired } from "../../../../../utils/config/updateFinancialYearIfExpired";
import { getModel } from "../../../../../utils/helpers/getModel";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    await getHotelDatabase();
    const FinanceSettingsModel = getModel("FinanceSettings", FinanceSettings);

    let financeSettings = await FinanceSettingsModel.findOne({});

    if (!financeSettings) {
      return NextResponse.json(
        {
          success: true,
          settings: {
            financialYear: {},
            invoiceFormat: {
              prefix: "INV",
              sequence: 0,
              financialYear: ""
            },
            financialYearHistory: [],
            color: "#00569B",
            logo: {}
          },
          message: "No settings found, using defaults"
        },
        { status: 200 }
      );
    }

    // Update financial year if expired
    financeSettings = await updateFinancialYearIfExpired(financeSettings);

    return NextResponse.json(
      {
        success: true,
        settings: financeSettings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching finance settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await getHotelDatabase();
    const FinanceSettingsModel = getModel("FinanceSettings", FinanceSettings);

    const formData = await request.formData();
    const startDate = new Date(formData.get("startDate"));
    const endDate = new Date(formData.get("endDate"));
    const prefix = formData.get("invoiceFormat");
    const color = formData.get("color");
    const manualControl = formData.get("manualYearControl") === "true";
    const manualYearActivation = formData.get("manualYearActivation") === "true";

    // Validate required fields
    if (!startDate || !endDate || !prefix) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate year difference
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    if (yearDiff < 1 || startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: "Financial year must span at least one full year" },
        { status: 400 }
      );
    }

    // Validate start date is first of month
    if (startDate.getDate() !== 1) {
      return NextResponse.json(
        { success: false, error: "Start date must be the first day of a month" },
        { status: 400 }
      );
    }

    // Calculate financial year format
    const startYear = startDate.getFullYear().toString().slice(-2);
    const endYear = endDate.getFullYear().toString().slice(-2);
    const yearFormat = `${startYear}-${endYear}`;

    // Handle logo upload
    let existingSettings = await FinanceSettingsModel.findOne({});
    let logoData = existingSettings?.logo || {};
    
    // Delete old logo if exists
    if (existingSettings?.logo?.url) {
      const oldPath = path.join(
        process.cwd(),
        "public",
        existingSettings.logo.url
      );
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Create directory if it doesn't exist
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "assets",
      "images",
      "finance",
      "logos"
    );
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save new logo
    const logoFile = formData.get("logo");
    if (logoFile && logoFile instanceof Blob) {
      try {
        const logoPath = path.join(uploadsDir, logoFile.name);
        await fs.promises.writeFile(
          logoPath,
          Buffer.from(await logoFile.arrayBuffer())
        );

        logoData = {
          url: `/assets/images/finance/logos/${logoFile.name}`,
          publicId: logoFile.name,
        };
      } catch (uploadError) {
        console.error("Error handling logo:", uploadError);
        return NextResponse.json(
          { success: false, error: "Failed to process logo upload" },
          { status: 500 }
        );
      }
    }

    // Prepare the update data with the new financial year
    const updateData = {
      financialYear: {
        startDate,
        endDate,
      },
      invoiceFormat: {
        prefix,
        sequence: 0,  // Initialize to 0
        financialYear: yearFormat,
      },
      color: color || "#00569B",
      logo: logoData,
    };

    if (existingSettings) {
      // Always update manual control setting first
      existingSettings.manualYearControl = manualControl;
      console.log('Setting manual control to:', manualControl);

      if (manualYearActivation) {
        // When manually activating a year, always enable manual control
        existingSettings.manualYearControl = true;
        
        // For manual activation, deactivate all years first
        existingSettings.financialYearHistory.forEach(year => {
          year.isActive = false;
        });

        // Find and activate the specific year by comparing dates
        const yearToActivate = existingSettings.financialYearHistory.find(
          y => 
            new Date(y.startDate).getTime() === startDate.getTime() && 
            new Date(y.endDate).getTime() === endDate.getTime()
        );

        if (yearToActivate) {
          yearToActivate.isActive = true;
          existingSettings.financialYear = {
            startDate: yearToActivate.startDate,
            endDate: yearToActivate.endDate
          };
          existingSettings.invoiceFormat.financialYear = yearToActivate.yearFormat;
        } else {
          throw new Error('Selected financial year not found');
        }
      } else {
        // Remove duplicate manual control assignment
        // existingSettings.manualYearControl = manualControl; // Remove this line
        
        // Rest of normal update logic
        existingSettings.financialYearHistory.forEach(year => {
          year.isActive = false;
        });

        const existingYearRecord = existingSettings.financialYearHistory.find(
          (y) => y.yearFormat === yearFormat
        );

        if (!existingYearRecord) {
          existingSettings.financialYearHistory.push({
            startDate,
            endDate,
            sequence: 0,  // Initialize sequence to 0
            yearFormat,
            isActive: true
          });
        } else {
          existingYearRecord.startDate = startDate;
          existingYearRecord.endDate = endDate;
          existingYearRecord.isActive = true;
          // Don't reset sequence if year exists
        }

        // Update other settings but maintain sequence
        existingSettings.financialYear = updateData.financialYear;
        existingSettings.invoiceFormat.prefix = updateData.invoiceFormat.prefix;
        existingSettings.invoiceFormat.financialYear = updateData.invoiceFormat.financialYear;
        existingSettings.color = updateData.color;
        existingSettings.logo = updateData.logo;
      }

      // Save changes
      await existingSettings.save();
      
      // Verify the save
      const savedSettings = await FinanceSettingsModel.findById(existingSettings._id);
      console.log('Verified manual control status:', savedSettings.manualYearControl);
    } else {
      // Create new settings with manual control
      updateData.financialYearHistory = [{
        startDate,
        endDate,
        sequence: 0,  // Initialize sequence to 0
        yearFormat,
        isActive: true // Ensure first year is active
      }];
      updateData.manualYearControl = manualControl;

      existingSettings = await FinanceSettingsModel.create(updateData);
    }

    return NextResponse.json(
      {
        success: true,
        settings: existingSettings,
        message: "Finance settings updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing finance settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: error.name === "ValidationError" ? 400 : 500 }
    );
  }
}
