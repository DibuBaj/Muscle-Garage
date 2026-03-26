const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    service: "gmail",
    auth: {
        user: process.env.EMAIL_ADMIN,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Connection Error:', error.message);
        console.error('Please check your EMAIL_ADMIN and EMAIL_PASS in .env file');
        console.error('Make sure you are using an App Password from Google Account settings');
    } else {
        console.log('Email transporter is ready to send emails');
    }
});

const sendOTPEmail = async (email, otp) => {

    const fs = require('fs');
    const logoPath = path.join(__dirname, '../../User-Frontend/muscle-garage/assets/images/logo.png');
    const logoExists = fs.existsSync(logoPath);

    const mailOptions = {
        from: process.env.EMAIL_ADMIN,
        to: email,
        subject: 'Muscle Garage - Verify Your Email',
        html: `
            <div style="font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 40px; text-align: center;">
                ${logoExists ? '<img src="cid:logo" alt="Muscle Garage Logo" style="width: 120px; height: 120px; margin-bottom: 30px;">' : '<h1 style="color: #000000; margin-bottom: 30px;">💪 MUSCLE GARAGE</h1>'}
                
                <h2 style="color: #000000; margin: 20px 0; font-size: 24px; font-family: 'Poppins', sans-serif;">Email Verification</h2>
                <p style="color: #000000; margin: 15px 0; font-size: 16px; font-family: 'Poppins', sans-serif;">Your OTP Code:</p>
                
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
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error.message);
        throw error;
    }
};

module.exports = { sendOTPEmail };
