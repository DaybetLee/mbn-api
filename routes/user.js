const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const config = require("config");
const Joi = require("joi");

const { User, validate } = require("../models/user");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");
const validateID = require("../middlewares/validateID");
const winston = require("../utils/winston");
const { Device } = require("../models/device");

// router.get("/", [authentication, authorization], (req, res) => {
//   User.find()
//     .sort("firstName")
//     .then((user) => res.send(user));
// });

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const email = await User.findOne({ email: req.body.email });
  if (email) return res.status(400).send(`${req.body.email} has been taken`);

  const user = new User(
    _.pick(req.body, ["firstName", "lastName", "email", "password"])
  );
  user.password = await bcrypt.hash(user.password, await bcrypt.genSalt(10));

  await user.save();

  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        history: {
          message: `User account created.`,
          origin: "System",
        },
      },
    }
  );

  const output = `
  <p>Hi ${user.firstName} ${user.lastName},</p>
    <p>Please complete your MailBoxNotifica account (<span style="font-weight: bold">${
      user.email
    }</span>) by confirming your email address.</p>
    <p>${config.get("domainUrl")}/verify/${user.generateAuthToken()}</p>
    <p>If the link above doesn't work, login to your account to generate a new verification email.</p>
    <footer>
      <hr>
      <a href="https://mailboxnotifica.herokuapp.com/">https://mailboxnotifica.herokuapp.com</a>
    </footer>
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

  let token = user.generateAuthToken();

  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(null);
});

router.put("/:id", [authentication, validateID], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const email = await User.findOne({ email: req.body.email });
  const current = await User.findById(req.params.id);

  if (email && current.email != email.email)
    return res.status(400).send(`${req.body.email} has been taken`);

  const password = await bcrypt.hash(
    req.body.password,
    await bcrypt.genSalt(10)
  );

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        firstName: req.body.firstName || current.firstName,
        lastName: req.body.lastName || current.lastName,
        email: req.body.email || current.email,
        password: password,
        verified: false,
      },
    },
    { new: true }
  );

  await User.updateOne(
    { _id: req.params.id },
    {
      $push: {
        history: {
          message: `User profile information has been changed.`,
          origin: "System",
        },
      },
    }
  );

  return user ? res.send(user) : res.status(404).send("User Not Found");
});

router.get("/:id", [authentication, validateID], async (req, res) => {
  const user = await User.findById(req.params.id);
  return user ? res.send(user) : res.status(404).send("User Not Found");
});

router.delete("/:id", validateID, async (req, res) => {
  const schema = Joi.object({
    password: Joi.string().required().label("Password"),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findById(req.params.id);

  const password = await bcrypt.compare(req.body.password, user.password);
  if (!password) return res.status(404).send("Incorrect Password");

  for (content in user.devices) {
    const device = await Device.findByIdAndRemove(user.devices[content]._id);
    if (!device) return res.status(404).send("Device not found");
  }

  await User.findByIdAndRemove(req.params.id);
  res.send(null);
});

router.get("/:id/history", [authentication, validateID], async (req, res) => {
  const user = await User.findById(req.params.id);
  return user
    ? res.send(user.historySort())
    : res.status(404).send("User Not Found");
});

// router.get("/:id/device", [authentication, validateID], async (req, res) => {
//   console.log("hi");
//   const user = await User.findById(req.params.id);

//   return res.send(user);
// });

module.exports = router;
