const express = require("express");
const router = express.Router();
const _ = require("lodash");

const { User } = require("../models/user");
const authentication = require("../middlewares/authentication");

router.put("/", authentication, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        verified: true,
      },
    },
    { new: true }
  );
  return user
    ? res
        .header("x-auth-token", user.generateAuthToken())
        .send(_.pick(user, ["verified"]))
    : res.status(404).send("User not found");
});

module.exports = router;
