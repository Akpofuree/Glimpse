const mongoose = require("mongoose");

const userInfoSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpiration: Date,
});

const userInfo = mongoose.model("Userinfo", userInfoSchema);
module.exports = userInfo;
