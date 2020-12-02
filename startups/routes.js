const express = require("express");

const proxy = require("../middlewares/proxy");
const error = require("../middlewares/error");
const nodemailer = require("../routes/nodemailer");
const user = require("../routes/user");
const device = require("../routes/device");
const userAuth = require("../routes/userAuth");
const verify = require("../routes/verify");

module.exports = (app) => {
  app.use(proxy);
  app.use(express.json());
  app.use("/api/mailer", nodemailer);
  app.use("/api/user", user);
  app.use("/api/device", device);
  app.use("/api/login", userAuth);
  app.use("/api/verify", verify);
  app.use(error);
};
