const monsgoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const deviceSchema = new monsgoose.Schema({
  mac: {
    type: String,
    match: /^([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2})$/,
    unique: true,
    uppercase: true,
    required: true,
  },
  psk: { type: String, maxlength: 255, minlength: 8, required: true },
});

deviceSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id }, config.get("secretKey"));
};

const Device = monsgoose.model("device", deviceSchema);

function validate(body) {
  const schema = Joi.object({
    mac: Joi.string()
      .insensitive()
      .pattern(
        /^([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2})$/
      )
      .required(),
    psk: Joi.string().min(8).max(255).required(),
  });
  return schema.validate(body);
}

exports.Device = Device;
exports.validate = validate;
