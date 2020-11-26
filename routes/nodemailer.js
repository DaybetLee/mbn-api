const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const config = require("config");

const winston = require("../utils/winston");
const { User } = require("../models/user");
const decrypt = require("../middlewares/decrypt");
const deviceAuth = require("../middlewares/deviceAuth");
const authentication = require("../middlewares/authentication");

router.post("/alert", [decrypt, deviceAuth], async (req, res) => {
  const user = await User.findOne({ "devices._id": req.device._id });
  if (!user) return res.status(404).send("User not found");

  const output = `
  <p>Hi ${user.name},</p>
 <p>${req.device.name} has received parcel.</p>
    `;

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
    from: `"MailBox Notifica" <${config.get("smtp.user")}>`,
    to: user.email,
    subject: `${req.device.name} Notification`,
    text: `${req.device.name} Notification`,
    html: output,
  });

  winston.info(`Message send: %s ${info.messageId}`);
  winston.info(`Preview URL: %s ${nodemailer.getTestMessageUrl(info)}`);

  await user.updateOne(user._id, {
    $push: {
      history: {
        message: `${req.device.name} has received parcel.`,
        origin: "Device",
      },
    },
  });

  res.send("1");
});

router.post("/verify", [authentication], async (req, res) => {
  const user = await User.findById(req.user._id);

  const output = `
  <p>Hi ${user.name},</p>
 <p>dummy.com/verify/${user.generateAuthToken()}</p>
    `;

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
    from: `"MailBox Notifica" <${config.get("smtp.user")}>`,
    to: user.email,
    subject: `MailBox Notifica Email Verification`,
    text: "MailBox Notifica Email Verification",
    html: output,
  });

  winston.info(`Message send: %s ${info.messageId}`);
  winston.info(`Preview URL: %s ${nodemailer.getTestMessageUrl(info)}`);

  res
    .header("x-auth-token", user.generateAuthToken())
    .send(user.generateAuthToken());
});

module.exports = router;
