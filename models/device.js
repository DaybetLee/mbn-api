const monsgoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const deviceSchema = new monsgoose.Schema({
  name: { type: String, maxlength: 255, default: "MailSensor" },
  mac: {
    type: String,
    match: /^([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2})$/,
    unique: true,
    uppercase: true,
    required: true,
  },
  psk: { type: String, maxlength: 255, minlength: 8, required: true },
  notify: { type: Boolean },
});

deviceSchema.methods.generateAuthToken = function () {
  return jwt.sign({ notify: this.notify }, config.get("secretKey"));
};

const Device = monsgoose.model("device", deviceSchema);

const validate = (body) => {
  const schema = Joi.object({
    name: Joi.string().max(255),
    mac: Joi.string()
      .insensitive()
      .pattern(
        /^([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2})$/
      )
      .required(),
    psk: Joi.string().min(8).max(255).required(),
    notify: Joi.bool(),
  });
  return schema.validate(body);
};

exports.Device = Device;
exports.validate = validate;
exports.deviceSchema = deviceSchema;
