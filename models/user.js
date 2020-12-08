const mongoose = require("mongoose");
const Joi = require("joi");
const jpc = require("joi-password-complexity");
const jwt = require("jsonwebtoken");
const config = require("config");
const moment = require("moment");

const { deviceSchema } = require("./device");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    minlength: 3,
    maxlength: 30,
    trim: true,
    required: true,
    match: /^[\w\d]{3,30}$/,
    set: (v) => v[0].toUpperCase() + v.substring(1).toLowerCase(),
  },
  lastName: {
    type: String,
    minlength: 3,
    maxlength: 30,
    trim: true,
    required: true,
    match: /^[\w\d]{3,30}$/,
    set: (v) => v[0].toUpperCase() + v.substring(1).toLowerCase(),
  },
  email: {
    type: String,
    unique: true,
    maxlength: 255,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    require: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 255,
  },
  verified: { type: Boolean, default: false },
  devices: {
    type: [
      new mongoose.Schema({
        name: { type: String, maxlength: 255, default: "MailSensor" },
        mac: {
          type: String,
          match: /^([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2})$/,
          uppercase: true,
          required: true,
        },
        psk: { type: String, maxlength: 255, minlength: 8, required: true },
        notify: { type: Boolean },
      }),
    ],
  },
  history: {
    type: [
      new mongoose.Schema({
        date: {
          type: Date,
          default: Date.now(),
        },
        message: { type: String, maxlength: 255 },
        origin: { type: String, enum: ["Device", "System"] },
      }),
    ],
  },
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, verified: this.verified },
    config.get("secretKey"),
    { expiresIn: 60 * 10 }
  );
};

userSchema.methods.historySort = function () {
  const history = this.history;
  return history.reverse().map((a) => {
    return {
      hourApart: moment().diff(a.date, "hours"),
      dayApart: moment().diff(a.date, "days"),
      date: new Date(a.date).toDateString(),
      time: new Date(a.date).toLocaleTimeString(),
      message: a.message,
      origin: a.origin,
    };
  });
};

const User = mongoose.model("user", userSchema);

const validate = (body) => {
  const option = {
    min: 10,
    max: 255,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 1,
    requirementCount: 4,
  };
  const schema = Joi.object({
    firstName: Joi.string().alphanum().max(30).required(),
    lastName: Joi.string().alphanum().max(30).required(),
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required(),
    password: jpc(option).required(),
    rep_pass: Joi.any()
      .equal(Joi.ref("password"))
      .required()
      .label("Confirm password")
      .messages({ "any.only": "{{#label}} does not match" }),
  }).with("password", "rep_pass");
  return schema.validate(body);
};

exports.User = User;
exports.validate = validate;
