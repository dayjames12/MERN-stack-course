const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models//Users');

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post(
  '/',
  [
    check('name', 'Name is Required').not().isEmpty(),
    check('email', 'Please Include a Valid Email').isEmail(),
    check(
      'password',
      'Please Enter a Password With 6 or More Character'
    ).isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(400).json({ err: err.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({
          err: [{ msg: 'User already exists' }],
        });
      }
      // Get users gravatar
      const avatar = gravatar.url(email, {
        s: '200', // size
        r: 'pg', // rating
        d: 'mm', // default
      });

      // create user
      user = new User({
        name,
        email,
        avatar,
        password,
      });

      // hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // save user to db
      await user.save();

      // get payload including user.id
      const payload = {
        user: {
          id: user.id,
        },
      };

      // sign the jwt token
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: 360000,
        },
        (err, token) => {
          // if error throw error, if token send token
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
