import nodemailer from "nodemailer";
import Handlebars from 'handlebars';
import { bookingConfirmationTemplate } from "./templates/bookingConfirmationTemplate";
import { getHotelDatabase } from "../utils/config/hotelConnection";
import emailConfigurationSchema from "../utils/model/settings/emailConfiguration/emailConfigurationSchema";
import { generateBookingPDF } from "../lib/pdfGenerator"
import { bookingCancellationTemplate } from "./templates/bookingCancellationTemplate";
import { getModel } from "../utils/helpers/getModel";

// Register Handlebars helper for equality comparison
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

export async function sendBookingConfirmationEmail({
  to,
  name,
  bookingDetails,
}: {
  to: string;
  name: string;
  bookingDetails: {
    bookingNumber: string;
    firstName: string;
    checkIn: string;
    checkOut: string;
    numberOfRooms?: number;
    numberOfGuests?: number;
    roomTypes?: string;
    roomNumbers?: string;
    propertyType?: string;
    eventType?: string;
    timeSlot?: {
      name: string;
      fromTime: string;
      toTime: string;
    };
    groomDetails?: {
      name: string;
    };
    brideDetails?: {
      name: string;
    };
    selectedServices?: Array<{
      name: string;
    }>;
    hotelName: string;
    hotelDisplayName: string;
    hotelWebsite?: string;
    hotelAddress: string;
    hotelPhone: string;
    hotelEmail: string;
    totalAmount: number;
    discountPercentage?: number;
    discountAmount?: number;
  };
}) {
  try {
    const { hotelData } = await getHotelDatabase();  
    const EmailConfig = getModel("EmailConfiguration", emailConfigurationSchema);
    const emailConfig = await EmailConfig.findOne();

    if (!emailConfig) {
      throw new Error("Email configuration not found");
    }

    const cleanHotelName = bookingDetails.hotelName
      .split('-')
      .slice(0, -1)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(bookingDetails.totalAmount);

    const requiredFields = ['smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword', 'senderEmail'];
    for (const field of requiredFields) {
      if (!emailConfig[field]) {
        throw new Error(`Missing email configuration: ${field}`);
      }
    }

    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    if (bookingDetails.checkIn && new Date(bookingDetails.checkIn).toString() !== 'Invalid Date') {
      bookingDetails.checkIn = new Date(bookingDetails.checkIn).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    if (bookingDetails.checkOut && new Date(bookingDetails.checkOut).toString() !== 'Invalid Date') {
      bookingDetails.checkOut = new Date(bookingDetails.checkOut).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    const compiledTemplate = Handlebars.compile(bookingConfirmationTemplate);
    const htmlBody = compiledTemplate({
      ...bookingDetails,
      hotelDisplayName: bookingDetails.hotelDisplayName || cleanHotelName,
      totalAmount: formattedAmount,
      name,
      currentYear: new Date().getFullYear()
    });

    await transport.verify();

    const pdfBuffer = await generateBookingPDF({
      ...bookingDetails,
      hotelDisplayName: bookingDetails.hotelDisplayName || cleanHotelName,
      totalAmount: bookingDetails.totalAmount
    });

    const sendResult = await transport.sendMail({
      from: {
        name: bookingDetails.hotelDisplayName || cleanHotelName,
        address: emailConfig.senderEmail
      },
      to,
      subject: `Booking Confirmation - ${bookingDetails.hotelDisplayName || cleanHotelName} - #${bookingDetails.bookingNumber}`,
      html: htmlBody,
      attachments: [
        {
          filename: `booking-confirmation-${bookingDetails.bookingNumber}.pdf`,
          content: pdfBuffer as Buffer,
          contentType: 'application/pdf'
        }
      ]
    });

    console.log("Email sent successfully with PDF attachment:", sendResult);
    return true;

  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return false;
  }
}

export async function sendBookingCancellationEmail({
  to,
  bookingDetails,
}: {
  to: string;
  bookingDetails: {
    bookingNumber: string;
    firstName: string;
    checkIn: string;
    checkOut: string;
    propertyType?: string;
    eventType?: string;
    timeSlot?: {
      name: string;
      fromTime: string;
      toTime: string;
    };
    numberOfRooms?: number;
    roomTypes?: string;
    hotelName: string;
    hotelDisplayName: string;
    hotelAddress?: string;
    hotelPhone?: string;
    hotelEmail?: string;
  };
}) {
  try {
    const { hotelData } = await getHotelDatabase();
    const EmailConfig = getModel("EmailConfiguration", emailConfigurationSchema);
    const emailConfig = await EmailConfig.findOne();

    if (!emailConfig) {
      throw new Error("Email configuration not found");
    }

    const cleanHotelName = bookingDetails.hotelName
      .split('-')
      .slice(0, -1)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const compiledTemplate = Handlebars.compile(bookingCancellationTemplate);
    const htmlBody = compiledTemplate({
      ...bookingDetails,
      hotelDisplayName: bookingDetails.hotelDisplayName || cleanHotelName
    });

    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword
      }
    });

    await transport.sendMail({
      from: {
        name: bookingDetails.hotelDisplayName || cleanHotelName,
        address: emailConfig.senderEmail
      },
      to,
      subject: `Booking Cancellation - ${bookingDetails.hotelDisplayName || cleanHotelName} - #${bookingDetails.bookingNumber}`,
      html: htmlBody
    });

    return true;
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return false;
  }
}