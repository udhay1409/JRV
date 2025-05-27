export const bookingConfirmationTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - {{hotelDisplayName}}</title>
    <style>
        /* Reset styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        /* Base styles */
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }

        /* Container */
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* Header */
        .header {
            background-color: #00569B;
            color: #ffffff;
            text-align: center;
            padding: 30px 20px;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 16px;
            opacity: 0.9;
        }

        /* Content */
        .content {
            padding: 30px;
        }

        .content p {
            margin-bottom: 15px;
        }

        /* Booking Details */
        .booking-details {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
        }

        .booking-details h2 {
            color: #00569B;
            font-size: 22px;
            margin-bottom: 20px;
        }

        .booking-info {
            display: table;
            width: 100%;
        }

        .booking-info-item {
            display: table-row;
        }

        .label, .value {
            display: table-cell;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }

        .label {
            font-weight: bold;
            color: #555;
            width: 40%;
        }

        .value {
            color: #333;
        }

        /* Important Notice */
        .notice {
            background-color: #e8f0fe;
            border-left: 4px solid #00569B;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }

        .notice p {
            margin: 0;
            color: #00569B;
        }

        /* Attachment Info */
        .attachment-info {
            background-color: #f5f5f5;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
        }

        /* Contact Info */
        .contact-info {
            background-color: #f0f7ff;
            border: 1px solid #cce5ff;
            border-radius: 8px;
            padding: 20px 15px;
            margin: 20px 0;
            text-align: center;
        }

        .contact-info p {
            margin: 10px 0;
            line-height: 1.6;
            word-wrap: break-word;
        }

        .contact-info strong {
            color: #00569B;
            font-size: 16px;
            display: block;
            margin-bottom: 10px;
        }

        /* Footer */
        .footer {
            background-color: #f8f9fa;
            text-align: center;
            padding: 30px;
            color: #666;
            border-top: 2px solid #eee;
        }

        .footer p {
            margin: 5px 0;
            font-size: 14px;
        }

        /* Button Styles */
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #00569B;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 20px;
        }

        .btn:hover {
            background-color: #00569B;
        }

        /* Enhanced Mobile Responsive Design */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100%;
                margin: 0;
                border-radius: 0;
                padding: 0;
            }

            .header {
                padding: 15px;
            }

            .header h1 {
                font-size: 20px;
                margin-bottom: 8px;
            }

            .header p {
                font-size: 14px;
            }

            .content {
                padding: 15px;
            }

            .booking-details {
                padding: 12px;
                margin: 15px 0;
                border-radius: 6px;
            }

            .booking-details h2 {
                font-size: 18px;
                margin-bottom: 15px;
            }

            .booking-info {
                display: block;
            }

            .booking-info-item {
                display: block;
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px solid #e9ecef;
            }

            .label, .value {
                display: block;
                width: 100%;
                padding: 3px 0;
            }

            .label {
                font-size: 12px;
                color: #666;
                margin-bottom: 2px;
            }

            .value {
                font-size: 14px;
                font-weight: 500;
            }

            .notice {
                padding: 12px;
                margin: 15px 0;
                font-size: 13px;
            }

            .attachment-info {
                padding: 12px;
                margin: 15px 0;
                font-size: 13px;
            }

            .btn {
                display: block;
                text-align: center;
                padding: 10px 20px;
                font-size: 14px;
                margin: 15px 0;
                width: 100%;
            }

            .footer {
                padding: 15px;
            }

            .footer p {
                font-size: 12px;
                margin: 3px 0;
            }

            /* UPDATED Mobile Styles for Contact Info */
            .contact-info {
                padding: 15px 10px;  /* Reduced padding for mobile */
                margin: 15px 0;
                text-align: left;   /* Align left for better readability */
            }
            .contact-info p {
                font-size: 13px;    /* Slightly smaller texts */
                margin: 6px 0;      /* Reduced vertical margin */
                word-break: break-word;
            }
            .contact-info strong {
                font-size: 14px;
                margin-bottom: 6px;
            }
        }

        @media only screen and (max-width: 320px) {
            .header h1 {
                font-size: 18px;
            }

            .booking-details h2 {
                font-size: 16px;
            }

            .content {
                padding: 10px;
            }

            .label {
                font-size: 11px;
            }

            .value {
                font-size: 13px;
            }

            .contact-info {
                padding: 12px 8px;
            }

            .contact-info p {
                font-size: 12px;
            }

            .contact-info strong {
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Booking Confirmation</h1>
            <p>Thank you for choosing our Mahal</p>
        </div>
        
        <div class="content">
            <p>Dear {{firstName}},</p>
            <p>We're delighted to confirm your reservation. Here are your booking details:</p>

            <div class="booking-details">
                <h2>Booking Information</h2>
                <div class="booking-info">
                    <div class="booking-info-item">
                        <div class="label">Booking Reference</div>
                        <div class="value">{{bookingNumber}}</div>
                    </div>
                    {{#if propertyType}}
                    <div class="booking-info-item">
                        <div class="label">Property Type</div>
                        <div class="value">{{propertyType}}</div>
                    </div>
                    {{/if}}
                    <div class="booking-info-item">
                        <div class="label">Check-in Date</div>
                        <div class="value">{{checkIn}}</div>
                    </div>
                    <div class="booking-info-item">
                        <div class="label">Check-out Date</div>
                        <div class="value">{{checkOut}}</div>
                    </div>
                    {{#if propertyType}}
                        {{#if (eq propertyType "hall")}}
                            {{#if eventType}}
                            <div class="booking-info-item">
                                <div class="label">Event Type</div>
                                <div class="value">{{eventType}}</div>
                            </div>
                            {{/if}}
                            {{#if timeSlot}}
                            <div class="booking-info-item">
                                <div class="label">Time Slot</div>
                                <div class="value">{{timeSlot.name}} ({{timeSlot.fromTime}} - {{timeSlot.toTime}})</div>
                            </div>
                            {{/if}}
                            {{#if groomDetails}}
                            <div class="booking-info-item">
                                <div class="label">Groom Details</div>
                                <div class="value">
                                    Name: {{groomDetails.name}}<br>
                                </div>
                            </div>
                            {{/if}}
                            {{#if brideDetails}}
                            <div class="booking-info-item">
                                <div class="label">Bride Details</div>
                                <div class="value">
                                    Name: {{brideDetails.name}}<br>
                                </div>
                            </div>
                            {{/if}}
                            {{#if selectedServices}}
                            <div class="booking-info-item">
                                <div class="label">Selected Services</div>
                                <div class="value">
                                    {{#each selectedServices}}
                                    • {{this.name}}<br>
                                    {{/each}}
                                </div>
                            </div>
                            {{/if}}
                        {{else}}
                            <div class="booking-info-item">
                                <div class="label">Number of Rooms</div>
                                <div class="value">{{numberOfRooms}}</div>
                            </div>
                            <div class="booking-info-item">
                                <div class="label">Number of Guests</div>
                                <div class="value">{{numberOfGuests}}</div>
                            </div>
                            <div class="booking-info-item">
                                <div class="label">Room Type(s)</div>
                                <div class="value">{{roomTypes}}</div>
                            </div>
                            <div class="booking-info-item">
                                <div class="label">Room Number(s)</div>
                                <div class="value">{{roomNumbers}}</div>
                            </div>
                        {{/if}}
                    {{/if}}
                    <div class="booking-info-item">
                        <div class="label">Total Amount</div>
                        <div class="value">{{totalAmount}}</div>
                    </div>
                    {{#if discountPercentage}}
                    <div class="booking-info-item">
                        <div class="label">Discount</div>
                        <div class="value">{{discountPercentage}}% ({{discountAmount}})</div>
                    </div>
                    {{/if}}
                </div>
            </div>

            <div class="notice">
                <p><strong>Important:</strong> If you need to modify or cancel your reservation, please contact us at least 24 hours before your check-in date.</p>
            </div>

            <p>We're excited to welcome you to {{hotelDisplayName}}. If you have any questions or need to make changes to your reservation, please don't hesitate to reach out to us.</p>

            {{#if hotelWebsite}}
            <a href="{{hotelWebsite}}" class="btn">Visit Our Website</a>
            {{/if}}

            <div class="attachment-info">
                <p>
                    <strong>📎 Attachment:</strong> We've attached a PDF copy of your booking confirmation for your records.
                    You can download and save it for future reference.
                </p>
            </div>

            <div class="contact-info">
                <p><strong>Need assistance?</strong></p>
                <p>Contact our team:</p>
                <p>📞 Phone: {{hotelPhone}}</p>
                <p>✉️ Email: {{hotelEmail}}</p>
                <p>📍 Address: {{hotelAddress}}</p>
            </div>
        </div>

        <div class="footer">
            <p><strong>{{hotelDisplayName}}</strong></p>
            <p>{{hotelAddress}}</p>
            <p>📞 {{hotelPhone}} | ✉️ {{hotelEmail}}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #888;">This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;


