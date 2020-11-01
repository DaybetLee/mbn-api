const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const config = require("config");

const winston = require("../utils/winston");
const deviceAA = require("../middlewares/deviceAA");

router.post("/", deviceAA, async (req, res) => {
  const output = "You have recieve mail/parcel!";

  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: config.get("smtp.user"),
      pass: config.get("smtp.pass"),
    },
  });

  let info = await transporter.sendMail({
    from: `"Real MailBox Alert" <${config.get("smtp.user")}>`,
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
