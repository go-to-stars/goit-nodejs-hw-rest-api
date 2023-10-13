const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = (emailOptions) => {
  const config = {
    host: process.env.POST_HOST,
    port: process.env.POST_PORT,
    secure: process.env.POST_SECURE,
    auth: {
      user: process.env.POST_AUTH_USER,
      pass: process.env.POST_AUTH_PASS,
    },
  };

  const transporter = nodemailer.createTransport(config);

  transporter.sendMail(emailOptions).catch((err) => console.log(err));
};

module.exports = sendEmail;
