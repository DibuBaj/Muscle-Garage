const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

console.log('Email config - USER:', process.env.EMAIL_USER);
console.log('Email config - PASS exists:', !!process.env.EMAIL_PASS);
console.log('Email config - PASS length:', process.env.EMAIL_PASS?.length);

const transporter = nodemailer.createTransport({
    // host: 'smtp.gmail.com',
    // port: 587,
    // secure: false,
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log('SMTP Connection Error:', error.message);
    } else {
        console.log('SMTP Server is ready to send emails');
    }
});

const sendOTPEmail = async (email, otp) => {
    console.log(`\n========================================`);
    console.log(`OTP for ${email}: ${otp}`);
    console.log(`========================================\n`);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Muscle Garage - Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1C1C1C; padding: 40px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #E57A25; margin: 0;">Muscle Garage</h1>
                    <p style="color: #B6B6B6; margin-top: 10px;">Your Fitness Journey Starts Here</p>
                </div>
                <div style="background-color: #2A2A2A; padding: 30px; border-radius: 8px; text-align: center;">
                    <h2 style="color: #FFFFFF; margin-bottom: 20px;">Email Verification</h2>
                    <p style="color: #B6B6B6; margin-bottom: 30px;">Use the following OTP to verify your email address:</p>
                    <div style="background-color: #1C1C1C; padding: 20px; border-radius: 8px; display: inline-block;">
                        <span style="font-size: 32px; font-weight: bold; color: #E57A25; letter-spacing: 8px;">${otp}</span>
                    </div>
                    <p style="color: #6A6A6A; margin-top: 30px; font-size: 14px;">This OTP will expire in 5 minutes.</p>
                </div>
                <p style="color: #6A6A6A; text-align: center; margin-top: 30px; font-size: 12px;">
                    If you didn't request this verification, please ignore this email.
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✓ Email sent successfully to:', email);
        console.log('  Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('✗ Email sending failed:', error.message);
        console.error('  Error code:', error.code);
        throw error;
    }
};

module.exports = { sendOTPEmail };
