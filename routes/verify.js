const express = require("express");
const router = express.Router();
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const config = require("config");
const Joi = require("joi");

const { User } = require("../models/user");

const validate = (body) => {
  const schema = Joi.object({
    token: Joi.string().required(),
  });
  return schema.validate(body);
};

router.put("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    const decode = jwt.verify(req.body.token, config.get("secretKey"));
    const user = await User.findByIdAndUpdate(
      decode._id,
      {
        $set: {
          verified: true,
        },
      },
      { new: true }
    );

    return user
      ? res.header("x-auth-token", user.generateAuthToken()).send(true)
      : res.status(404).send("User not found");
  } catch (ex) {
    return res.status(404).send(false);
  }
});

module.exports = router;
