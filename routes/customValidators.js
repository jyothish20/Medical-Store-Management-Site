// Custom validation middleware for email
const validateEmail = (req, res, next) => {
    const email = req.body.email;
    const errors = [];
 
    if (!isValidEmail(email)) {
      errors.push({ msg: 'Invalid email address' });
    }
 
    // Assign the errors to req.validationErrors
    req.validationErrors = req.validationErrors || [];
    req.validationErrors.push(...errors);
 
    next();
  };
 
  // Custom validation middleware for password
  const validatePassword = (req, res, next) => {
    const password = req.body.password;
    const errors = [];
 
    if (!isValidPassword(password)) {
      errors.push({ msg: 'Password must meet certain criteria' });
    }
 
    // Assign the errors to req.validationErrors
    req.validationErrors = req.validationErrors || [];
    req.validationErrors.push(...errors);
 
    next();
  };
 


// Custom email validation logic
const isValidEmail = (email) => {
  // Implement your custom email validation logic here
  // Example: Check if the email follows a specific format using regular expression
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


// Custom password validation logic
const isValidPassword = (password) => {
  // Implement your custom password validation logic here
  // Example: Check if the password is at least 8 characters long
  return password.length >= 8;
};


module.exports = { validateEmail, validatePassword };
