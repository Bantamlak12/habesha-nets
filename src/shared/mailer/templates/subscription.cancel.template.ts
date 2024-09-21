export function subscriptioncancelEmail(
    companyName: string,
    year: number,
    userName: string,
    verificationCode: string,
  ) {
    return `
    <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Activation</title>
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
              <h1>Subscription Payment Cancel</h1>
          </div>
          <div class="content">
              <p>Hello, ${userName}</p>
              <p>We are writing to confirm that your subscription payment has been successfully processed. Your subscription plan will be active ${year}, and you will have access to all the benefits included in your plan during this period.</p>
              <div class="verification-code">${verificationCode}</div>
              <p>If you wish to cancel your subscription, please be aware that it will remain active until the end of the current billing cycle. After this period, your subscription will not be renewed, and you will lose access to the subscription benefits.</p>
              <p>Should you have any questions or require assistance, please do not hesitate to reach out to our support team at [Support Email] or [Support Phone Number].</p>
              <p>Best Regards,<br>The ${companyName} Team</p>
          </div>
          <div class="footer">
              <p>&copy; ${year} ${companyName}. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
  `;
  }
  