export const validationRules = {
  firstName: {
    required: true,
    minLength: 2,
    pattern: /^[a-zA-Z\s]*$/,
    message: {
      required: "First name is required",
      minLength: "First name must be at least 2 characters",
      pattern: "First name can only contain letters and spaces"
    }
  },
  lastName: {
    required: true,
    minLength: 1,
    pattern: /^[a-zA-Z\s]*$/,
    message: {
      required: "Last name is required",
      minLength: "Last name must be at least 1 character",
      pattern: "Last name can only contain letters and spaces"
    }
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: {
      required: "Email is required",
      pattern: "Please enter a valid email address"
    }
  },
  mobileNo: {
    required: true,
    pattern: /^\+?[0-9]{8,15}$/,
    message: {
      required: "Mobile number is required",
      pattern: "Please enter a valid mobile number"
    }
  },
  aadharNumber: {
    pattern: /^[0-9]{12}$/,
    message: {
      pattern: "Please enter a valid 12-digit Aadhar number"
    }
  },
  passportNumber: {
    pattern: /^[A-Z0-9]{8,}$/,
    message: {
      pattern: "Please enter a valid passport number"
    }
  }
};

export const validateField = (name, value, rules) => {
  if (!rules[name]) return null;

  const rule = rules[name];
  
  if (rule.required && !value) {
    return rule.message.required;
  }
  
  if (value) {
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message.minLength;
    }
    
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message.pattern;
    }
  }
  
  return null;
};
