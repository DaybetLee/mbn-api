const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const config = require("config");

const { User, validate } = require("../models/user");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");
const validateID = require("../middlewares/validateID");
const winston = require("../utils/winston");

router.get("/", [authentication, authorization], (req, res) => {
  User.find()
    .sort("name")
    .then((user) => res.send(user));
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const email = await User.findOne({ email: req.body.email });
  if (email) return res.status(400).send("Email taken");

  const user = new User(_.pick(req.body, ["name", "email", "password"]));
  user.password = await bcrypt.hash(user.password, await bcrypt.genSalt(10));

  await user.save();

  await user.updateOne(user._id, {
    $push: {
      history: {
        message: `User account created.`,
        origin: "System",
      },
    },
  });

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

router.delete("/:id", validateID, async (req, res) => {
  const user = await User.findByIdAndRemove(req.params.id);
  return user ? res.send(user) : res.status(404).send("User Not Found");
});

router.get("/:id/history", [authentication, validateID], async (req, res) => {
  const user = await User.findById(req.params.id);
  return user
    ? res.send(user.historySort())
    : res.status(404).send("User Not Found");
});

module.exports = router;
