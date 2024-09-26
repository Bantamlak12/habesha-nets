export function subscriptionConfirmationEmail(
    companyName: string,
    year: number,
    userName: string,
    paymentAmount: string,
    subscriptionPlan: string,
    nextBillingDate: string,
    currenct: string
  ) {
      const formattedDate = new Date().toLocaleDateString();
    return `
    <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Payment Confirmation</title>
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
          .content .highlight {
              font-weight: bold;
              color: #333333;
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
              <h1>Subscription Activated</h1>
          </div>
          <div class="content">
              <p>Dear ${userName},</p>
              <p>Thank you for your recent payment of <span class="highlight">${paymentAmount} ${currenct}</span>. We’re pleased to confirm that your subscription to the <span class="highlight">${subscriptionPlan}</span> has been successfully processed on ${formattedDate}.</p>
              <p>Your subscription is now active and will be renewed on <span class="highlight">${nextBillingDate}</span>.</p>
              <p>If you have any questions or need further assistance, feel free to reach out to our support team at  <a href="mailto:support@example.com">support@example.com</a><br>Phone: +1-800-123-456.</p>
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