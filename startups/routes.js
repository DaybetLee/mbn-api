const express = require("express");
const error = require("../middlewares/error");
const nodemailer = require("../routes/nodemailer");
const user = require("../routes/user");

module.exports = (app) => {
  app.use(express.json());
  app.use("/", nodemailer);
  app.use("/user", user);
  app.use(error);
};
