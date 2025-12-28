const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

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

    const fs = require('fs');
    const logoPath = path.join(__dirname, '../../Frontend/muscle-garage/assets/images/logo.png');
    const logoExists = fs.existsSync(logoPath);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Muscle Garage - Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 40px; text-align: center;">
                ${logoExists ? '<img src="cid:logo" alt="Muscle Garage Logo" style="width: 120px; height: 120px; margin-bottom: 30px;">' : '<h1 style="color: #000000; margin-bottom: 30px;">💪 MUSCLE GARAGE</h1>'}
                
                <h2 style="color: #000000; margin: 20px 0; font-size: 24px;">Email Verification</h2>
                <p style="color: #000000; margin: 15px 0; font-size: 16px;">Your OTP Code:</p>
                
                <div style="background-color: #F0F0F0; padding: 20px; border-radius: 8px; margin: 30px 0;">
                    <span style="font-size: 36px; font-weight: bold; color: #000000; letter-spacing: 4px;">${otp}</span>
                </div>
                
                <p style="color: #000000; margin: 15px 0; font-size: 14px;">This code will expire in 5 minutes.</p>
                <p style="color: #666666; margin-top: 30px; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
            </div>
        `,
        attachments: logoExists ? [
            {
                filename: 'logo.png',
                path: logoPath,
                cid: 'logo'
            }
        ] : []
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
