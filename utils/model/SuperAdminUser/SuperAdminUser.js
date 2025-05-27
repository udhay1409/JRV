import mongoose from "mongoose";
import crypto from "crypto";

const SuperAdminUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifyToken: String,
  verifyTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
})

SuperAdminUserSchema.methods.getVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex")
  this.verifyToken = crypto.createHash("sha256").update(verificationToken).digest("hex")
  this.verifyTokenExpire = new Date(Date.now() + 30 * 60 * 1000)
  return verificationToken
}

SuperAdminUserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex")
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
  this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  return resetToken
}

module.exports = mongoose.models.SuperAdminUser || mongoose.model("SuperAdminUser", SuperAdminUserSchema)

