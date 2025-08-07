import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "eyobbirhanu01@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "xpno crdu iqri ernm",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendOTPEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || "eyobbirhanu01@gmail.com",
    to: email,
    subject: "Your Login OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Login Code</h2>
        <p>Please use the following code to login to your account:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
          <strong>${otp}</strong>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendConciergeRequestNotification = async (requestData: any) => {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error("ADMIN_EMAIL not configured in environment variables");
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || "eyobbirhanu01@gmail.com",
    to: adminEmail,
    subject: "New Concierge Request - Review Required",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          New Concierge Request Submitted
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Request Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 150px;">Full Name:</td>
              <td style="padding: 8px;">${requestData.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Email:</td>
              <td style="padding: 8px;">${requestData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Phone:</td>
              <td style="padding: 8px;">${requestData.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Company:</td>
              <td style="padding: 8px;">${
                requestData.company || "Not specified"
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Design Style:</td>
              <td style="padding: 8px;">${
                requestData.designStyle || "Not specified"
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Primary Color:</td>
              <td style="padding: 8px;">${
                requestData.primaryColor || "Not specified"
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Must Have Features:</td>
              <td style="padding: 8px;">
                ${
                  requestData.mustHaveFeatures &&
                  requestData.mustHaveFeatures.length > 0
                    ? requestData.mustHaveFeatures.join(", ")
                    : "Not specified"
                }
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Bio:</td>
              <td style="padding: 8px;">${
                requestData.bio || "Not provided"
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Special Requests:</td>
              <td style="padding: 8px;">${
                requestData.specialRequests || "None"
              }</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Agent Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 150px;">Agent Name:</td>
              <td style="padding: 8px;">${requestData.agent.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Subdomain:</td>
              <td style="padding: 8px;">${requestData.agent.subdomain}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Request ID:</td>
              <td style="padding: 8px;">${requestData.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Submitted:</td>
              <td style="padding: 8px;">${new Date(
                requestData.createdAt
              ).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;">
            <strong>Action Required:</strong> Please review this concierge request and take appropriate action.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This is an automated notification from the concierge request system.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Concierge request notification sent to admin: ${adminEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending concierge request notification:", error);
    return false;
  }
};
