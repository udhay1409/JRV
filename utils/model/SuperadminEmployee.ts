import mongoose from 'mongoose';
import crypto from 'crypto';

const SuperadminUserEmployeeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
/*   firstName: { type: String, required: true },
  lastName: { type: String, required: true }, */
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  role: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Role",
    required: true
  },
  permissions: [{
    page: String,
    url: String,
    actions: {
      view: Boolean,
      add: Boolean,
      edit: Boolean,
      delete: Boolean
    }
  }],
/*   resetPasswordToken: String,
  resetPasswordExpire: Date, */
});

SuperadminUserEmployeeSchema.methods.getResetPasswordToken = function (): string {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return resetToken;
};

export default SuperadminUserEmployeeSchema;

// import mongoose from 'mongoose';
// import crypto from 'crypto';

// const SuperadminEmployeeSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "Role",
//     required: true
//   },
//   permissions: [{
//     page: String,
//     url: String,
//     actions: {
//       view: Boolean,
//       add: Boolean,
//       edit: Boolean,
//       delete: Boolean
//     }
//   }],
//   resetPasswordToken: String,
//   resetPasswordExpire: Date,
// });

// SuperadminEmployeeSchema.methods.getResetPasswordToken = function() {
//   const resetToken = crypto.randomBytes(20).toString('hex');
//   this.resetPasswordToken = crypto
//     .createHash('sha256')
//     .update(resetToken)
//     .digest('hex');
//   this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
//   return resetToken;
// };

// const SuperadminEmployee = mongoose.models.SuperadminEmployee || mongoose.model("SuperadminEmployee", superadminEmployeeSchema)
  

//   export default SuperadminEmployee