// import mongoose from 'mongoose';

// const SuperAdminGeneralSchema = new mongoose.Schema({
//   adminName: String,
//   mobile: String,
//   email: String,
//   address: String,
// /*   timeZone: String,
//   timeFormat: String,
//   dateFormat: String, */
//   logo: String,
//   color: String,
// });

// export default SuperAdminGeneralSchema;

import mongoose from "mongoose"

const SuperAdminGeneralSchema = new mongoose.Schema({
  adminName: String,
  mobile: String,
  email: String,
  address: String,
  logo: String,
  color: String,
  additionalAdmins: [
    {
      adminName: String,
      mobile: String,
      email: String,
      address: String,
    },
  ],
})

export default SuperAdminGeneralSchema
