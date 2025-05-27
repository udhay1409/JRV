import { jsPDF } from "jspdf"
import "jspdf-autotable"
import type { UserOptions } from "jspdf-autotable"
import type { BookingDetails } from "./types"

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDFWithAutoTable
  lastAutoTable?: AutoTableOutput
}

export async function generateBookingPDF(bookingDetails: BookingDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createPDFDocument()
      const { pageWidth, pageHeight, margin, contentWidth } = getPageDimensions(doc)

      addHeader(doc, bookingDetails, pageWidth)
      const currentY = addBookingDetails(doc, bookingDetails, margin, contentWidth)
      addImportantNotice(doc, currentY, margin, contentWidth)
      addFooter(doc, bookingDetails, currentY, margin, pageWidth)

      resolve(Buffer.from(doc.output("arraybuffer")))
    } catch (error) {
      reject(error)
    }
  })
}

function createPDFDocument(): jsPDFWithAutoTable {
  return new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as jsPDFWithAutoTable
}

function getPageDimensions(doc: jsPDFWithAutoTable) {
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  return { pageWidth, pageHeight, margin, contentWidth }
}

function addHeader(doc: jsPDFWithAutoTable, bookingDetails: BookingDetails, pageWidth: number) {
  // Add blue header background
  doc.setFillColor(0, 86, 155)
  doc.rect(0, 0, pageWidth, 45, "F")

  // Add header text
  doc.setTextColor(255, 255, 255)
  /* addCenteredText(doc, bookingDetails.hotelName, 25, 24, "bold") */
  addCenteredText(doc, bookingDetails.hotelDisplayName, 18, 20, "bold")
  addCenteredText(doc, "Booking Confirmation", 32, 16)
  doc.setTextColor(0, 0, 0)
}

interface AutoTableOutput {
  finalY: number;
}

function addBookingDetails(
  doc: jsPDFWithAutoTable,
  bookingDetails: BookingDetails,
  margin: number,
  contentWidth: number,
): number {
  const startY = 65
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Booking Details", margin, startY)

  // Format total amount with proper spacing
  const formattedAmount = `Rs. ${bookingDetails.totalAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  const details = [
    { label: "Booking Reference:", value: bookingDetails.bookingNumber },
    { label: "Guest Name:", value: bookingDetails.firstName },
    { label: "Check-in:", value: bookingDetails.checkIn },
    { label: "Check-out:", value: bookingDetails.checkOut },
  ]

  // Add property type specific details
  if (bookingDetails.propertyType) {
    details.push({ label: "Property Type:", value: bookingDetails.propertyType })

    if (bookingDetails.propertyType === "hall") {
      if (bookingDetails.eventType) {
        details.push({ label: "Event Type:", value: bookingDetails.eventType })
      }
      if (bookingDetails.timeSlot) {
        details.push({ 
          label: "Time Slot:", 
          value: `${bookingDetails.timeSlot.name} (${bookingDetails.timeSlot.fromTime} - ${bookingDetails.timeSlot.toTime})` 
        })
      }
      if (bookingDetails.groomDetails) {
        details.push({ 
          label: "Groom Details:", 
          value: `Name: ${bookingDetails.groomDetails.name}` 
        })
      }
      if (bookingDetails.brideDetails) {
        details.push({ 
          label: "Bride Details:", 
          value: `Name: ${bookingDetails.brideDetails.name}` 
        })
      }
      if (bookingDetails.selectedServices) {
        details.push({ 
          label: "Selected Services:", 
          value: bookingDetails.selectedServices.map(service => `• ${service.name}`).join('\n') 
        })
      }
    } else {
      if (bookingDetails.numberOfRooms) {
        details.push({ label: "Number of Rooms:", value: bookingDetails.numberOfRooms.toString() })
      }
      if (bookingDetails.numberOfGuests) {
        details.push({ label: "Number of Guests:", value: bookingDetails.numberOfGuests.toString() })
      }
      if (bookingDetails.roomTypes) {
        details.push({ label: "Room Type(s):", value: bookingDetails.roomTypes })
      }
      if (bookingDetails.roomNumbers) {
        details.push({ label: "Room Number(s):", value: bookingDetails.roomNumbers })
      }
    }
  }

  details.push({ label: "Total Amount:", value: formattedAmount })

  if (bookingDetails.discountPercentage) {
    details.push({ 
      label: "Discount:", 
      value: `${bookingDetails.discountPercentage}% (${bookingDetails.discountAmount})` 
    })
  }

  doc.autoTable({
    startY: startY + 10,
    head: [["Details", "Information"]],
    body: details.map((detail) => [detail.label, detail.value]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [0, 86, 155],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 12,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: contentWidth * 0.4 },
      1: { cellWidth: contentWidth * 0.6 },
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  })

  return (doc.lastAutoTable?.finalY ?? startY + 50) + 5
}

function addImportantNotice(doc: jsPDFWithAutoTable, currentY: number, margin: number, contentWidth: number) {
  const noticeText =
    "Important: If you need to modify or cancel your reservation, please contact us at least 24 hours before your check-in date."

  // Add notice box
  doc.setFillColor(230, 247, 255)
  doc.setDrawColor(0, 86, 155)
  doc.roundedRect(margin, currentY, contentWidth, 18, 3, 3, "FD")

  // Add notice text
  doc.setTextColor(0, 86, 155)
  doc.setFontSize(10)
  const splitNotice = doc.splitTextToSize(noticeText, contentWidth - 10)
  doc.text(splitNotice, margin + 5, currentY + 6)
  doc.setTextColor(0, 0, 0)

  // Calculate the final Y position after the notice box and text
  const finalY = currentY + 18; // Base height of the box
  // We don't need to add text height directly because the box size should accommodate it
  // Add a small buffer below the box
  return finalY + 5; // Adjusted spacing
}

function addFooter(
  doc: jsPDFWithAutoTable,
  bookingDetails: BookingDetails,
  currentY: number,
  margin: number,
  pageWidth: number,
): number {
  // Ensure minimum spacing from the bottom of the page
  const pageHeight = doc.internal.pageSize.height
  const minSpacingFromBottom = 40 // Minimum space needed for footer content
  
  // Calculate footer start position
  let footerStartY = Math.min(currentY + 30, pageHeight - minSpacingFromBottom)
  
  // If content would overflow to next page, start a new page
  if (footerStartY + minSpacingFromBottom > pageHeight) {
    doc.addPage()
    footerStartY = 30 // Start at top of new page with some margin
  }

  // Add generation date above the footer line
  addCenteredText(doc, `Generated on ${new Date().toLocaleDateString("en-IN")}`, footerStartY - 8, 9)

  // Add footer line
  doc.setDrawColor(0, 86, 155)
  doc.setLineWidth(0.5)
  doc.line(margin, footerStartY, pageWidth - margin, footerStartY)
  // Add footer content
  let nextY = footerStartY + 10
  nextY = addCenteredText(doc, bookingDetails.hotelDisplayName, nextY, 12, "bold")

  if (bookingDetails.hotelAddress) {
    nextY = addCenteredText(doc, bookingDetails.hotelAddress, nextY + 5, 10)
  }

  if (bookingDetails.hotelPhone) {
    nextY = addCenteredText(doc, `Phone: ${bookingDetails.hotelPhone}`, nextY + 5, 10)
  }

  if (bookingDetails.hotelEmail) {
    nextY = addCenteredText(doc, `Email: ${bookingDetails.hotelEmail}`, nextY + 5, 10)
  }

  return nextY
}

function addCenteredText(
  doc: jsPDFWithAutoTable,
  text: string,
  y: number,
  fontSize: number,
  fontStyle = "normal",
): number {
  doc.setFontSize(fontSize)
  doc.setFont("helvetica", fontStyle)
  doc.text(text, doc.internal.pageSize.width / 2, y, { align: "center" })
  return y + fontSize / 3
}



