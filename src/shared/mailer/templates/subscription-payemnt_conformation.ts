export function subscriptionPayemntConformationEmail(
  companyName: string,
  year: number,
  userName: string,
  transaction_id: string,
  date: string,
  totalamount: string,
  currency: string,
) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
            max-width: 600px;
            margin: auto;
        }
        h1 {
            color: #333333;
        }
        p {
            color: #555555;
            line-height: 1.5;
        }
        .footer {
            margin-top: 20px;
            border-top: 1px solid #e0e0e0;
            padding-top: 10px;
            font-size: 0.9em;
            color: #888888;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Payment Confirmation</h1>
        <p>Dear ${userName},</p>
        
        <p>Thank you for your payment!</p>
        
        <p><strong>Transaction ID:</strong> ${transaction_id}</p>
        <p><strong>Amount:</strong> ${totalamount} ${currency}</p>
        <p><strong>Date:</strong> ${date}</p>
        
        <p>Your subscription is now active. If you have any questions or need assistance, please contact us.</p>
        
        <p>Thank you for your business!</p>
        <p>Best Regards,<br>The ${companyName} Team</p>

<div class="footer">
              <p>&copy; ${year} ${companyName}. All rights reserved.</p>
          </div>
    </div>
</body>
</html>
`;
}
