const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const Joi = require("joi");

const bcrypt = require("bcrypt");

const validate = (body) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required(),
    password: Joi.string().required(),
  });
  return schema.validate(body);
};

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).send("Invalid email address or password");

  const password = await bcrypt.compare(req.body.password, user.password);
  if (!password)
    return res.status(404).send("Invalid email address or password");

  res
    .header("x-auth-token", user.generateAuthToken())
    .header("access-control-expose-headers", "x-auth-token")
    .send(user.generateAuthToken());
});

module.exports = router;
