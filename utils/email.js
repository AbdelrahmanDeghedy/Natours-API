// const nodemailer = require('nodemailer');

// const mg = require('nodemailer-mailgun-transport');

// const sendEmail = async options => {
//   // 1. Create a transporter

//   const auth = {
//     auth: {
//       api_key: 'key-f9bf4d6064fe06fc775ea5dcf3f86361-e31dc3cc-8458a43b',
//       domain: 'sandboxf1ac7fe6cc454327a88840ef36b5fe65.mailgun.org'
//     }
//   };

//   const nodemailerMailgun = nodemailer.createTransport(mg(auth));

//   const mailOptions = {
//     from: 'Abdeelrahman Deghedy <abdelrahman.deghedy@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message
//   };

//   // 3. Sending the email
//   await nodemailerMailgun.sendMail(mailOptions);
// };

const sgMail = require('@sendgrid/mail');

const sendEmail = async options => {
  sgMail.setApiKey(process.env.SEND_GRID_API);
  const msg = {
    from: 'Abdeelrahman Deghedy <abdelrahman.deghedy@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };
  await sgMail.send(msg);
};

module.exports = sendEmail;
