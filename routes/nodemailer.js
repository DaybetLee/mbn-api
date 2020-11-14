const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const config = require("config");

const winston = require("../utils/winston");
const { User } = require("../models/user");
const decrypt = require("../middlewares/decrypt");
const deviceAuth = require("../middlewares/deviceAuth");

router.post("/alert", [decrypt, deviceAuth], async (req, res) => {
  const user = await User.findOne({ "devices._id": req.device._id });
  if (!user) return res.status(404).send("User not found");

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
    to: user.email,
    subject: `Real MailBox Alert`,
    text: "Real MailBox Alert",
    html: output,
  });

  winston.info(`Message send: %s ${info.messageId}`);
  winston.info(`Preview URL: %s ${nodemailer.getTestMessageUrl(info)}`);

  res.send("1");
});

module.exports = router;
