const mongoose = require("mongoose");
const Joi = require("joi");

const userSchema = new mongoose.Schema({
  name: { type: String, maxlength: 255 },
});

const User = mongoose.model("user", userSchema);

function validate(body) {
  const schema = Joi.object({
    name: Joi.string().max(255).required(),
  });
  return schema.validate(body);
}

exports.User = User;
exports.validate = validate;
