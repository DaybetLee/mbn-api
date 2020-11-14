const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const config = require("config");
const bcrypt = require("bcrypt");

const winston = require("../utils/winston");
const { User } = require("../models/user");
const decrypt = require("../middlewares/decrypt");
const { Device, validate } = require("../models/device");

router.post("/alert", decrypt, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const device = await Device.findOne({ mac: req.body.mac });
  if (!device) return res.status(400).send("Device not registered");
  if (!device.notify) return res.status(405).send("Method not allowed");

  const psk = await bcrypt.compare(req.body.psk, device.psk);
  if (!psk) return res.status(400).send("Invalid key");

  const user = await User.findOne({ "devices._id": device._id });
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
