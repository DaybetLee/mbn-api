const express = require("express");
const router = express.Router();

const { User, validate } = require("../models/user");

router.get("/", (req, res) => {
  User.find()
    .sort("name")
    .then((user) => res.send(user));
});

router.post("/", (req, res) => {
  console.log(req.body);
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  new User({ name: req.body.name }).save().then((user) => res.send(user));
});

router.delete("/:id", async (req, res) => {
  const user = await User.findByIdAndRemove(req.params.id);
  return user ? res.send(user) : res.status(404).send("User Not Found");
});

module.exports = router;
