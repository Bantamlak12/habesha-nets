export function accountVerificationEmail(
  companyName: string,
  year: number,
  expiryTime: number,
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
            <h1>Activate Your Account</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Thank you for registering! To complete the activation of your account, please use the verification code below:</p>
            <div class="verification-code">${verificationCode}</div>
            <p>Enter this code on the website to verify your account. The activation code will expire after ${expiryTime} minutes.</p>
            <p>If you didn’t request this, please ignore this email.</p>
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
