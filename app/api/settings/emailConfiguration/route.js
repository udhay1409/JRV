import { NextResponse } from "next/server";
import { getHotelDatabase } from "@/utils/config/hotelConnection";
import emailConfigurationSchema from "@/utils/model/settings/emailConfiguration/emailConfigurationSchema";
import { getModel } from "@/utils/helpers/getModel";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    await getHotelDatabase();
    const EmailConfig = getModel("EmailConfiguration", emailConfigurationSchema);
    const config = await EmailConfig.findOne();
    
    return NextResponse.json({
      success: true,
      emailConfig: config || {}
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await getHotelDatabase();
    const EmailConfig = getModel("EmailConfiguration", emailConfigurationSchema);
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'smtpPort', 
      'smtpUsername', 
      'smtpPassword', 
      'senderEmail',
      'smtpHost'
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Update or create email configuration
    const config = await EmailConfig.findOneAndUpdate(
      {},
      {
        ...body,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      emailConfig: config
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await getHotelDatabase();
    const EmailConfig = getModel("EmailConfiguration", emailConfigurationSchema);
    const { testEmail, message } = await request.json();

    // Validate test email
    if (!testEmail || !testEmail.includes('@')) {
      return NextResponse.json(
        { success: false, message: "Valid test email is required" },
        { status: 400 }
      );
    }

    const config = await EmailConfig.findOne();

    if (!config) {
      return NextResponse.json(
        { success: false, message: "Email configuration not found" },
        { status: 404 }
      );
    }

    // Validate SMTP configuration
    if (!config.smtpHost || !config.smtpPort || !config.smtpUsername || !config.smtpPassword) {
      return NextResponse.json(
        { success: false, message: "Incomplete SMTP configuration" },
        { status: 400 }
      );
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: parseInt(config.smtpPort),
        secure: parseInt(config.smtpPort) === 465,
        auth: {
          user: config.smtpUsername,
          pass: config.smtpPassword,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        debug: true,
        logger: true // Enable logging
      });

      // Add specific error handling for Gmail
      if (config.smtpHost.includes('gmail')) {
      
        try {
          await transporter.verify();
       
        } catch (gmailError) {
        
          return NextResponse.json(
            {
              success: false,
              message: "Gmail authentication failed. Please ensure you're using an App Password if 2FA is enabled.",
              details: `For Gmail: 
                1. Enable 2-Step Verification in your Google Account
                2. Generate an App Password (Google Account → Security → App Passwords)
                3. Use that 16-character App Password instead of your regular password`
            },
            { status: 401 }
          );
        }
      }

      // Send test email
      const info = await transporter.sendMail({
        from: config.senderEmail,
        to: testEmail,
        subject: "Test Email",
        text: message || "This is a test email",
      });

      
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
        messageId: info.messageId
      });
    } catch (smtpError) {
     

      let errorMessage = "Failed to send email. ";
      if (smtpError.code === 'EAUTH') {
        errorMessage += "Authentication failed. Please check your username and password. ";
        if (config.smtpHost.includes('gmail')) {
          errorMessage += "For Gmail accounts, make sure to use an App Password if 2FA is enabled.";
        }
      } else if (smtpError.code === 'ESOCKET') {
        errorMessage += "Connection failed. Please check your SMTP host and port settings.";
      } else {
        errorMessage += smtpError.message;
      }

      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          details: smtpError.message,
          code: smtpError.code
        },
        { status: 500 }
      );
    }
  } catch (error) {
   
    return NextResponse.json(
      { 
        success: false, 
        message: "Server error: " + error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}
