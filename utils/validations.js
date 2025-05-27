export const validateGSTNumber = (gst) => {
  if (!gst) return "GST number is required";
  const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstPattern.test(gst) ? "" : "Invalid GST number format";
};

export const validateMobileNumber = (mobile) => {
  if (!mobile) return "Mobile number is required";
  const mobilePattern = /^[6-9]\d{9}$/;
  return mobilePattern.test(mobile) ? "" : "Invalid mobile number";
};

export const validateEmail = (email) => {
  if (!email) return "Email is required";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email) ? "" : "Invalid email format";
};

export const validatePinCode = (pinCode) => {
  if (!pinCode) return "PIN code is required";
  const pinCodePattern = /^[1-9][0-9]{5}$/;
  return pinCodePattern.test(pinCode) ? "" : "Invalid PIN code";
};

export const validateRequired = (value, fieldName) => {
  return value ? "" : `${fieldName} is required`;
};
