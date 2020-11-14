const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const Joi = require("joi");
const jpc = require("joi-password-complexity");
const bcrypt = require("bcrypt");

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
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required(),
    password: jpc(option).required(),
  });
  return schema.validate(body);
};

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).send("Incorrect log in");

  const password = await bcrypt.compare(req.body.password, user.password);
  if (!password) return res.status(404).send("Incorrect log in");

  res
    .header("x-auth-token", user.generateAuthToken())
    .send(user.generateAuthToken());
});

module.exports = router;
