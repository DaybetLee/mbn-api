const express = require("express");

const error = require("../middlewares/error");
const nodemailer = require("../routes/nodemailer");
const user = require("../routes/user");
const device = require("../routes/device");
const deviceAuth = require("../routes/deviceAuth");

module.exports = (app) => {
  app.use(express.json());
  app.use("/", nodemailer);
  app.use("/api/user", user);
  app.use("/api/device", device);
  app.use("/api/auth", deviceAuth);
  app.use(error);
};
