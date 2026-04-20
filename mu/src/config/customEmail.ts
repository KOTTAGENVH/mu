import nodemailer from "nodemailer";

export const customEmail = async (
  email: string | string[],
  subject: string,
  baseBody: string,
  ip?: string,
): Promise<boolean> => {
  console.log("sending emails");
  try {
    const mailTransporter = nodemailer.createTransport({
      host: "smtppro.zoho.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.AUTHEMAIL,
        pass: process.env.AUTHEMAILPASS,
      },
    });

    const logoUrl = `https://mu.nowenkottage.com/mu.png`;
    const emailArray = Array.isArray(email) ? email : [email];
    for (let i = 0; i < emailArray.length; i++) {
      const recipient = emailArray[i];
      const year = new Date().getFullYear();

      const mailDetails = {
        from: `MU <${process.env.AUTHEMAIL}>`,
        to: recipient,
        subject: subject,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0d0f18;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="background-color:#0d0f18;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="max-width:560px;background-color:#13151f;border-radius:16px;border:1px solid #1e2130;overflow:hidden;">

          <!-- Top accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#6c8fff 0%,#a78bfa 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding:36px 40px 24px;">
              <img src="${logoUrl}" alt="MU Logo"
                style="width:64px;height:64px;border-radius:50%;object-fit:cover;display:block;border:2px solid #1e2130;" />
              <h1 style="margin:16px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                MU
              </h1>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#1e2130;font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#9ca3af;">
                ${baseBody}
              </p>

              ${
                ip && i === 0
                  ? `
              <!-- IP notice chip -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
                <tr>
                  <td style="background-color:#1e2130;border:1px solid #2a2d3a;border-radius:8px;padding:10px 14px;">
                    <p style="margin:0;font-size:12px;color:#6b7280;">
                      🌐 &nbsp;<span style="color:#9ca3af;">Request originated from IP:</span>
                      &nbsp;<span style="color:#6c8fff;font-family:monospace;font-size:12px;">${ip}</span>
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#1e2130;font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 40px 32px;">
              <p style="margin:0 0 4px;font-size:12px;color:#4b5563;">
                This is an automated message from MU - please do not reply.
              </p>
              <p style="margin:0;font-size:12px;color:#374151;">
                &copy; ${year} MU. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>
        `,
      };

      await mailTransporter.sendMail(mailDetails);
    }

    console.log("Emails sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending email:", (error as Error).message);
    return false;
  }
};
