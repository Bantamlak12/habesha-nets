export function generatePasswordResetEmail(
  resetUrl: string,
  year: number,
): string {
  return `<!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding: 10px 0;
        border-bottom: 1px solid #dddddd;
      }
      .header h1 {
        font-size: 24px;
        color: #333333;
      }
      .content {
        padding: 20px;
        font-size: 16px;
        color: #555555;
        line-height: 1.6;
      }
      .content p {
        margin-bottom: 15px;
      }
      .reset-button {
        display: inline-block;
        padding: 10px 20px;
        font-size: 16px;
        color: #ffffff;
        background-color: #007BFF;
        border: none;
        border-radius: 5px;
        text-decoration: none;
        margin: 20px 0;
      }
      .verification-code {
        font-size: 32px;
        font-weight: bold;
        color: #333333;
        text-align: center;
        background-color: #f8f8f8;
        padding: 10px;
        border: 1px solid #dddddd;
        border-radius: 4px;
        display: inline-block;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        font-size: 14px;
        color: #aaaaaa;
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #dddddd;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset</h1>
      </div>
      <div class="content">
        <p>You requested a password reset. Click the button below or use the link provided to reset your password. The link is valid for one hour.</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" class="reset-button">Reset Password</a>
        </p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
      <div class="footer">
            <p>&copy; ${year} Habesha Nets. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
