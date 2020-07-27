const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  avatarURL: { type: String },
  subscription: {
    type: String,
    enum: ["free", "pro", "premium"],
    default: "free",
  },
  token: { type: String },
  verificationToken: { type: String },
});

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
