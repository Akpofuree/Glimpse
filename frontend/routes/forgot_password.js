const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const router = express.Router();
const userInfo = require("../models/userinfo_model");

// forgot password request
router.post("/forgot-password", async (req, res) => {
    try {
        const user = await userInfo.findOne({email: req.body.email})

        if (!user) {
            return res.status(404).json({message: 'User not found'})
        }

        const resetToken = crypto.randomBytes(32)
        user.resetToken = resetToken
        user.resetTokenExpiration = Date.now() + 3600000
        await user.save()

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 
            }

        });
        await transporter.sendMail({
            to: user.email,
            subject: "Password reset",
            html: `
            <p>Password reset</p>
            <p>Click <a href="http://localhost:3000/auth/reset/${resetToken}">here</a> to reset your password</p>
            `
        })
    }
});

module.exports = router;
