export interface BookingDetails {
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
  }
  
  