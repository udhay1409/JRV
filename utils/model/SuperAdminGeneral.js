import { Schema, models, model } from "mongoose";
const generalSchema = new Schema({
  name: { type: String, required: true },
  mobile: String,
  email: String,
  address: String,
  timeZone: String,
  timeFormat: String,
  dateFormat: String,
  logo: String,
  color: String,
});

const SuperAdminGeneral = models.General || model("General", generalSchema);

export default SuperAdminGeneral;
