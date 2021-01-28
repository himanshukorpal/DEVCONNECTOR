const express = require("express");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const router = express.Router();
const bcrypt = require("bcryptjs");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

// @route POST api/users
// @desc Register user
// @access Public

router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({ min: 6 }),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // See if User Exists
      let user = await User.findOne({ email });

      if (user) {
        res.status(400).json({ errors: [{ msg: "User already exists" }] });
      }

      // Get users gravatar
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      // TO Hash A Password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          console.log({ token });
          return res.json({ token });
        }
      );

      res.send("User registerd");
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
