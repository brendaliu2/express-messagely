"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

const { BadRequestError, UnauthorizedError } = require('../expressError');

const User = require('../models/user');
//TODO: use login timestamp

/** POST /login: {username, password} => {token} */
router.post('/login', async function (req, res, next) {
  const { username, password } = req.body;
  const user = await User.authenticate(username, password);

  if (user) {
    const token = jwt.sign({ username }, SECRET_KEY);

    return res.json({ token });
  }
  throw new UnauthorizedError("Invalid user/password");

});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post('/register', async function (req, res, next) {
  const user = await User.register(req.body);

  if (user) {
    const { username } = user;

    const token = jwt.sign({ username }, SECRET_KEY);

    return res.json({ token });
  }
  throw new BadRequestError("Invalid user/password");
});

module.exports = router;