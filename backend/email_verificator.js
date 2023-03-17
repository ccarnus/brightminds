function verifyEmail(email) {
    var emailRegex = /^([a-zA-Z0-9._%-]+)@gatech.edu$/;
    return emailRegex.test(email);
  }

module.exports = verifyEmail;