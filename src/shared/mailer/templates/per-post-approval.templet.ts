export function perPostPayemntConformationEmail(
    companyName: string,
    userName: string,
    status: string,
    description: string,
    date: string,
    totalamount: string,
    currency: string,
  ){
return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Approval Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h2 {
            color: #333;
        }
        p {
            color: #555;
            line-height: 1.6;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Payment Approval Confirmation</h2>
        <p>Dear ${userName},</p>
        <p>We are pleased to inform you that your payment has been successfully approved. Thank you for choosing our services!</p>
        
        <h3>Payment Details:</h3>
        <ul>
            <li><strong>Payment Status:</strong> ${status}</li>
            <li><strong>Amount:</strong> ${totalamount}</li>
            <li><strong>Currency:</strong> ${currency}</li>
            <li><strong>Description:</strong>${description} </li>
            <li><strong>Transaction Date:</strong> ${date}</li>
        </ul>

        <p>Your transaction is now complete, and you can expect the service/product to be delivered shortly. If you have any questions or require further assistance, please do not hesitate to reach out to our support team.</p>

        <p>Thank you for your trust in us!</p>

        <div class="footer">
            <p>Best regards,<br>
            [Your Name]<br>
            [Your Position]<br>
            ${companyName}<br>
            [Your Company Phone Number]<br>
            [Your Company Email Address]<br>
            [Your Company Website URL]</p>
        </div>
    </div>
</body>
</html>`
    }