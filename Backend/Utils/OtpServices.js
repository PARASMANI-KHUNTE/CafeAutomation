const nodemailer = require('nodemailer');
require('dotenv').config();


const otpStore = new Map(); 

const sendOTP = async (email) => {
 // Generate a random 4-digit OTP
const OTP = Math.floor(Math.random() * 9000) + 1000;
  // Configure Nodemailer transporter with your email provider's credentials
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host : 'smtp.gmail.com',
    auth: {
      user: process.env.EMAIL_USER , // Ensure these are set in your .env file
      pass: process.env.EMAIL_PASSWORD ,
    },
  });

  // Email options
  const mailOptions = {
    from: {name : 'Cozy Corner' , address : process.env.EMAIL_USER} ,
    to: email,
    subject: 'OTP Verification',
    text: `Your OTP is: ${OTP}. It will expire in 5 minutes.`,
  };

  try {
    // Send the email
    const info = await transporter.sendMail(mailOptions);

    // Store the OTP in the temporary store with expiration (5 minutes)
    otpStore.set(email, { otp: OTP, expires: Date.now() + 5 * 60 * 1000 });

    return OTP; // Return the OTP for further use if needed
  } catch (error) {
    throw error;
  }
};

const verifyOTP = async (email, OTP) => {
  // Retrieve the OTP details from the store
  const otpDetails = otpStore.get(email);
  
  console.log('Verifying OTP:', { 
    email,
    providedOTP: OTP,
    storedOTP: otpDetails?.otp,
    expires: otpDetails?.expires,
    currentTime: Date.now(),
    isExpired: otpDetails?.expires < Date.now()
  });

  // Check if OTP exists and is not expired
  if (!otpDetails || otpDetails.expires < Date.now()) {
    console.log('OTP expired or not found');
    otpStore.delete(email); // Remove expired OTP
    return false; // OTP expired or not found
  }

  // Convert both OTPs to strings for comparison to avoid type issues
  const storedOTP = String(otpDetails.otp);
  const providedOTP = String(OTP);
  
  console.log('Comparing OTPs:', { storedOTP, providedOTP, equal: storedOTP === providedOTP });

  // Compare the provided OTP with the stored OTP
  if (storedOTP === providedOTP) {
    console.log('OTP verified successfully');
    // Don't delete the OTP here - we'll keep it valid until password reset
    // It will still expire after the time limit
    return true;
  }

  console.log('OTP does not match');
  return false; // OTP does not match
};


const sendLink = async ({ to, subject, html }) => {
  try {
    // Configure Nodemailer transporter with your email provider's credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER, // Ensure these are set in your .env file
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: 'Failed to send email', error };
  }
};

// Clear OTP after password reset
const clearOTP = (email) => {
  console.log(`Clearing OTP for ${email}`);
  otpStore.delete(email);
  return true;
};

module.exports = { sendOTP, verifyOTP, clearOTP, sendLink };