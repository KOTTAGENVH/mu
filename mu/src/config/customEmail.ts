import nodemailer from "nodemailer";

export const customEmail = async (
  email: string,
  subject: string,
  body: string
): Promise<boolean> => {
  console.log("sending email");
  try {
    let mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.email,
        pass: process.env.emailPass,
      },
    });

    //Logo URL
    const logoUrl = `${process.env.LOGO_URL}`; 

    let mailDetails = {
      from: process.env.email,
      to: email,
      subject: subject,
      html: `
            <div>
              <p>${body}</p>
              <img src="${logoUrl}" alt="CricBoost Logo" style="width: 100px; height: auto;" />
            </div>
        `,
    };

    await mailTransporter.sendMail(mailDetails);
    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending email:", (error as Error).message);
    return false;
  }
};
