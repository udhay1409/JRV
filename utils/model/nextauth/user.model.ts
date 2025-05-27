import mongoose, { Document, Schema } from "mongoose";
import crypto from "crypto";
import { validatePassword } from '../../passwordValidation';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  isAdmin: boolean;
  verifyToken: string;
  verifyTokenExpire: Date;
  resetPasswordToken: string;
  resetPasswordExpire: Date;
  googleId?: string;
  picture?: string;
  locale?: string;
  role: string;
  getVerificationToken(): string;
  getResetPasswordToken(dbName: string): string;
}

const UserSchema: Schema<IUser> = new mongoose.Schema({
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
    validate: {
      validator: function(password: string) {
        const { isValid } = validatePassword(password);
        return isValid;
      },
      message: 'Password must meet the following requirements:\n' +
               '- At least 8 characters long\n' +
               '- At least one uppercase letter\n' +
               '- At least one lowercase letter\n' +
               '- At least one number\n' +
               '- At least one special character (@$!%*?&)'
    }
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,  // Changed back to false - will be set true only for hotel admin
  },
  verifyToken: String,
  verifyTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  googleId: String,
  picture: String,
  locale: String,
  role: {
    type: String,
    required: true,
    enum: ['hotel admin']  // Only allowing hotel admin role
  }
});

UserSchema.methods.getVerificationToken = function (): string {
  const verificationToken = crypto.randomBytes(20).toString("hex");
  this.verifyToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.verifyTokenExpire = new Date(Date.now() + 30 * 60 * 1000);
  return verificationToken;
};

UserSchema.methods.getResetPasswordToken = function (dbName: string): string {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return Buffer.from(`${resetToken}:${dbName}`).toString('base64');
};

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

