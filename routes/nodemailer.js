const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const winston = require("../utils/winston");

router.post("/", async (req, res) => {
  const output = "You have recieve mail/parcel!";

  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: `daybet.test@gmail.com`,
      pass: `Whatev3r!`,
    },
  });

  let info = await transporter.sendMail({
    from: '"Real MailBox Alert" <daybet.test@gmail.com>',
    to: `daybetlee@gmail.com`,
    subject: `Real MailBox Alert`,
    text: "Real MailBox Alert",
    html: output,
  });

  winston.info(`Message send: %s ${info.messageId}`);
  winston.info(`Preview URL: %s ${nodemailer.getTestMessageUrl(info)}`);

  res.send(output);
});

module.exports = router;
