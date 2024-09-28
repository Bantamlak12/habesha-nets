export function subscriptionCancelEmail(
  companyName: string,
  year: number,
  userName: string,
  lastPaymentAmount: string, // Last payment value
  cancellationDate: string,
  status: string, // Date of cancellation
  currency: string, // Default to USD if no currency provided
) {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Subscription Cancellation Confirmation</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f9f9f9;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 40px auto;
                  background-color: #ffffff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                  text-align: center;
                  padding-bottom: 20px;
                  border-bottom: 1px solid #dddddd;
              }
              .header h1 {
                  font-size: 22px;
                  color: #333;
              }
              .content {
                  padding: 20px;
                  font-size: 16px;
                  color: #555;
                  line-height: 1.6;
              }
              .content p {
                  margin-bottom: 20px;
              }
              .footer {
                  text-align: center;
                  font-size: 14px;
                  color: #aaaaaa;
                  margin-top: 20px;
                  padding-top: 10px;
                  border-top: 1px solid #dddddd;
              }
              .button {
                  display: inline-block;
                  padding: 10px 20px;
                  font-size: 16px;
                  color: white;
                  background-color: #007bff;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 20px 0;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Subscription Cancelled</h1>
              </div>
              <div class="content">
                  <p>Hello, ${userName},</p>
                  <p>We are writing to confirm that your subscription has been cancelled as of <strong>${cancellationDate}</strong>. You will continue to have access to our services until the end of your current billing cycle.</p>
                  <p>Your last payment of <strong>${lastPaymentAmount} ${currency}</strong> was processed before the cancellation.</p>
                  <p>No further payments will be charged, and after the current period, your access to the subscription benefits will be discontinued.</p>
                  <p>If you have any questions or need further assistance, feel free to contact our support team at:</p>
                  <p>Email: <a href="mailto:support@example.com">support@example.com</a><br>Phone: +1-800-123-456</p>
                  <p>Thank you for being a valued member of our service.</p>
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
