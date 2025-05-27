export const bookingCancellationTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Cancellation - {{hotelDisplayName}}</title>
    <style>
        /* ... existing styles ... */
        
        .booking-details {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
        }

        .booking-details p {
            margin: 12px 0;
            font-size: 15px;
            line-height: 1.6;
        }

        .booking-details strong {
            display: inline-block;
            width: 150px;
            color: #444;
        }

        .notice-box {
            background-color: #fff4f4;
            border-left: 4px solid #ea4335;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }

        .contact-info {
            background-color: #f0f7ff;
            border: 1px solid #cce5ff;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }

        .footer {
            background-color: #f8f9fa;
            text-align: center;
            padding: 25px;
            border-top: 2px solid #eee;
        }

        .footer p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Booking Cancellation Confirmation</h1>
        </div>
        
        <div class="content">
            <p>Dear {{firstName}},</p>
            <p>We have received and processed your cancellation request. Below are the details of your cancelled booking:</p>

            <div class="booking-details">
                <p><strong>Booking Reference:</strong> {{bookingNumber}}</p>
                <p><strong>Mahal:</strong> {{hotelDisplayName}}</p>
                {{#if propertyType}}
                <p><strong>Property Type:</strong> {{propertyType}}</p>
                {{/if}}
                <p><strong>Check-in Date:</strong> {{checkIn}}</p>
                <p><strong>Check-out Date:</strong> {{checkOut}}</p>
                {{#if propertyType}}
                    {{#if (eq propertyType "hall")}}
                        {{#if eventType}}
                        <p><strong>Event Type:</strong> {{eventType}}</p>
                        {{/if}}
                        {{#if timeSlot}}
                        <p><strong>Time Slot:</strong> {{timeSlot.name}} ({{timeSlot.fromTime}} - {{timeSlot.toTime}})</p>
                        {{/if}}
                    {{else}}
                        <p><strong>Number of Rooms:</strong> {{numberOfRooms}}</p>
                        <p><strong>Room Type(s):</strong> {{roomTypes}}</p>
                    {{/if}}
                {{/if}}
            </div>

            <div class="notice-box">
                <p><strong>Important Notice:</strong> If you did not request this cancellation, please contact us immediately using the information below.</p>
            </div>

            <p>Although we're sorry you won't be staying with us this time, we look forward to welcoming you to {{hotelDisplayName}} on another occasion.</p>

            <div class="contact-info">
                <p><strong>Need assistance?</strong></p>
                <p>Contact our guest services team:</p>
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