const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const { db } = require("./config/database");
const userInfo = require("./models/userinfo_model");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Serve the HTML page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/home.html"));
});
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/signup.html"));
});
app.get("/forget", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/forgot.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/views/login.html");
});
app.post("/signup", async (req, res) => {
  try {
    const { email, number, password } = req.body;
    function validateNumber(number) {
      if (number === "" || number === null || number === undefined) {
        return "";
      }

      let firstDigit = number.charAt(0);

      // If the first digit is "0", assume it's a Nigerian local number and replace "0" with "234"
      if (firstDigit === "0") {
        let formatted = number.replace("0", "234").replace(/\s/g, "");
        number = formatted;
      }

      // If the first digit is "+", remove it and any whitespace characters
      if (firstDigit === "+") {
        let formatted = number.replace("+", "").replace(/\s/g, "");
        number = formatted;
      }

      // Remove any remaining whitespace characters from the phone number
      number = number.replace(/\s/g, "");

      return number;
    }
    if (!validateNumber(number)) {
      return res.send("<script>alert('Invalid phone number');</script>");
    }
    const existingUser = await userInfo.findOne({ email, number });
    if (existingUser) {
      return res.send("<script>alert('User already exists');</script>");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userInfo.create({
      email,
      number,
      password: hashedPassword,
    });
    res.redirect("/login");
  } catch (err) {
    console.error("Error during signup:", err);
    res.send("<script>alert('Something went wrong');</script>");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userInfo.findOne({ email });
    if (!user) {
      return res.send("<script>alert'Authentication failed'</script>;");
    }
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.send("<script>alert'Authentication failed'</script>;");
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.redirect("/home");
    // res.json({ token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/forget", async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`Searching for user: ${email}`);
    const user = await userInfo.findOne({ email });
    console.log("User found", user);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    const resetToken = crypto.randomBytes(32);
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      ignoreTLS: true,
      secure: true,
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.USER,
      to: user.email,
      subject: "Password reset",
      html: `
            <p>Password reset</p>
            <p>Click <a href="http://localhost:3000/views/reset/${resetToken}">here</a> to reset your password</p>
            `,
    });
    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/reset/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const user = await user.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});
const server = () => {
  try {
    db();
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
  app.listen(PORT, () => {
    console.log(`Server is running on port localhost:${PORT}`);
  });
};
server();
