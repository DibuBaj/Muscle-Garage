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

const formatMoney = (amount = 0) => `NPR ${Number(amount || 0).toFixed(2)}`;

const buildOrderDetailsHtml = (order) => {
    const rows = (order.products || [])
        .map((item) => {
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.priceAtPurchase || 0);
            const lineTotal = quantity * unitPrice;
            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${item.productName}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: center;">${quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatMoney(unitPrice)}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatMoney(lineTotal)}</td>
                </tr>
            `;
        })
        .join('');

    const subtotal = Number(order.orderTotal || 0);
    const shipping = Number(order.shippingCost || 0);
    const grandTotal = subtotal + shipping;

    return `
        <div style="margin: 24px 0;">
            <p style="margin: 6px 0;"><strong>Order ID:</strong> ${order._id}</p>
            <p style="margin: 6px 0;"><strong>Customer:</strong> ${order.customerName}</p>
            <p style="margin: 6px 0;"><strong>Phone:</strong> ${order.phone}</p>
            <p style="margin: 6px 0;"><strong>Delivery Address:</strong> ${order.location}</p>
            <p style="margin: 6px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p style="margin: 6px 0;"><strong>Current Status:</strong> ${order.status}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0 20px;">
            <thead>
                <tr style="background-color: #f7f7f7;">
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e5e5;">Item</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e5e5;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">Unit Price</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e5e5;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div style="text-align: right;">
            <p style="margin: 6px 0;"><strong>Subtotal:</strong> ${formatMoney(subtotal)}</p>
            <p style="margin: 6px 0;"><strong>Shipping:</strong> ${formatMoney(shipping)}</p>
            <p style="margin: 6px 0; font-size: 18px;"><strong>Grand Total:</strong> ${formatMoney(grandTotal)}</p>
        </div>
    `;
};

const sendOrderPlacedEmail = async (order) => {
    const mailOptions = {
        from: process.env.EMAIL_ADMIN,
        to: order.email,
        subject: `Muscle Garage - Order Placed (#${order._id})`,
        html: `
            <div style="font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 24px; color: #111111;">
                <h2 style="margin-bottom: 8px;">Your order has been placed</h2>
                <p style="margin-top: 0; color: #444444;">Thank you for ordering from Muscle Garage. We have received your order and will process it shortly.</p>
                ${buildOrderDetailsHtml(order)}
                <p style="margin-top: 24px; color: #666666; font-size: 13px;">Need help? Reply to this email and our team will assist you.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    return true;
};

const sendOrderStatusEmail = async (order) => {
    if (!order || !order.email) {
        return false;
    }

    let heading = '';
    let body = '';
    let subject = '';

    if (order.status === 'In Progress') {
        subject = `Muscle Garage - Order In Progress (#${order._id})`;
        heading = 'Your order is on the way';
        body = `Your order ${order._id} is now in progress and on the way.`;
    } else if (order.status === 'Fulfilled') {
        subject = `Muscle Garage - Order Delivered (#${order._id})`;
        heading = 'Your order has been delivered';
        body = `Your order ${order._id} has been delivered successfully.`;
    } else {
        return false;
    }

    const mailOptions = {
        from: process.env.EMAIL_ADMIN,
        to: order.email,
        subject,
        html: `
            <div style="font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 24px; color: #111111;">
                <h2 style="margin-bottom: 8px;">${heading}</h2>
                <p style="margin-top: 0; color: #444444;">${body}</p>
                ${buildOrderDetailsHtml(order)}
                <p style="margin-top: 24px; color: #666666; font-size: 13px;">Thank you for choosing Muscle Garage.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    return true;
};

module.exports = { sendOTPEmail, sendOrderPlacedEmail, sendOrderStatusEmail };
