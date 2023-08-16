require("dotenv").config();
const nodemailer = require("nodemailer");

async function generateOTP() {
  const otpLength = 4; // Set the desired OTP length
  let otpCode = "";

  // Generate a 4-digit OTP
  for (let i = 0; i < otpLength; i++) {
    const digit = Math.floor(Math.random() * 10);
    otpCode += digit;
  }

  return otpCode;
}

async function sendOTP() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });

  try {
    const otpCode = await generateOTP();

    await transporter.sendMail({
      from: "email@gmail.com",
      to: "email@gmail.com",
      subject: "OTP",
      html: `<p>Your OTP: ${otpCode}</p>`,
    });

    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

sendOTP();
