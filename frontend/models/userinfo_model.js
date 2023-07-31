const mongoose = require("mongoose");

const userInfoSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  number: { type: Number, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});

const userInfo = mongoose.model("Userinfo", userInfoSchema);
module.exports = userInfo;
