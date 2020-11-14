const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");

const { User, validate } = require("../models/user");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");
const validateID = require("../middlewares/validateID");

router.get("/", [authentication, authorization], (req, res) => {
  User.find()
    .sort("name")
    .then((user) => res.send(user));
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const email = await User.findOne({ email: req.body.email });
  if (email) return res.status(400).send("Email taken");

  const user = new User(_.pick(req.body, ["name", "email", "password"]));
  user.password = await bcrypt.hash(user.password, await bcrypt.genSalt(10));

  await user.save();
  res
    .header("x-auth-token", user.generateAuthToken())
    .send(user.generateAuthToken());
});

router.delete("/:id", validateID, async (req, res) => {
  const user = await User.findByIdAndRemove(req.params.id);
  return user ? res.send(user) : res.status(404).send("User Not Found");
});

module.exports = router;
