export const verificationEmailTemplate = (verificationLink: string) => {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Base styles */
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f4f7ff;
        margin: 0;
        padding: 0;
      }

      .container {
        max-width: 600px;
        margin: 40px auto;
        padding: 30px;
        background: linear-gradient(145deg, #ffffff, #f8faff);
        border-radius: 16px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
      }

      h1 {
        color: #1a1a1a;
        font-size: 24px;
        font-weight: 700;
        text-align: center;
        margin: 0 0 20px;
        letter-spacing: -0.5px;
      }

      p {
        color: #4a5568;
        line-height: 1.6;
        font-size: 16px;
        text-align: center;
        margin: 0 0 30px;
      }

      .button-container {
        text-align: center;
        margin: 35px 0;
      }

      .button {
        display: inline-block;
        padding: 16px 36px;
        background-color: #0066ff !important;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 102, 255, 0.15);
        transition: all 0.3s ease;
      }

      .expire-time {
        text-align: center;
        color: #718096;
        font-size: 14px;
        margin-top: 30px;
      }

      .footer {
        text-align: center;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        color: #718096;
        font-size: 14px;
      }

      /* Gmail-specific fixes */
      @media screen and (max-width: 600px) {
        .container {
          margin: 20px;
          padding: 20px;
        }
        
        .button {
          display: block;
          margin: 0 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Verify Your Email Address</h1>
      <p>
        Thank you for signing up! To complete your registration and access your account,
        please verify your email address by clicking the button below.
      </p>

      <div class="button-container">
        <a href="${verificationLink}" 
           style="display: inline-block; padding: 16px 36px; background-color: #0066ff; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; border: none; box-shadow: 0 4px 12px rgba(0, 102, 255, 0.15);"
        >
          Verify Email Address
        </a>
      </div>

      <p class="expire-time">This verification link will expire in 30 minutes for security reasons.</p>

      <div class="footer">
        If you didn't create an account, you can safely ignore this email.
      </div>
    </div>
  </body>
</html>
  `;
};
