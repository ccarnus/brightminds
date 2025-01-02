function verifyEmail(email) {
  // This regex checks for:
  // - At least one character before the @
  // - An @ symbol
  // - At least one character between @ and the last dot
  // - At least one character after the last dot
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = verifyEmail;
