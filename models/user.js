"use strict";

const db = require('../db');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const { BadRequestError, NotFoundError } = require('../expressError');

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {

    const results = await db.query(`
    SELECT username
        FROM users
        WHERE username = $1`,
      [username]);

    let user = results.rows[0];

    if (!user) {
      const hashedPassword = await bcrypt.hash(
        password, BCRYPT_WORK_FACTOR);

      user = await db.query(
        `INSERT INTO users (username, password, first_name, last_name, phone, join_at,  last_login_at)
          VALUES ($1, $2, $3, $4, $5, LOCALTIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone]
      );

      return user.rows[0];
    }

    throw new BadRequestError(`${username} taken!`);
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(`
    SELECT password
        FROM users
        WHERE username = $1`,
      [username]);

    let hashedPassword = results.rows[0].password;

    if (hashedPassword) {
      if (await bcrypt.compare(password, hashedPassword) === true) {
        return true;
      }
    }
    return false;

  }

  /** Update last_login_at for user*/

  // TIMESTAMP '2004-10-19 10:23:54'
  // TIMESTAMP '2004-10-19 10:23:54+02' with time zone

  static async updateLoginTimestamp(username) {


    const results = await db.query(`
      UPDATE users
      SET last_login_at= CURRENT_TIMESTAMP
      WHERE username = $1
      RETURNING username`,
      [username]);


    if (!results.rows[0]) {
      throw new NotFoundError(`${username} not found!`);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(`
    SELECT username, first_name, last_name
      FROM users `);

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1`,
      [username]);

    const user = results.rows[0];

    if (!user) {
      throw new NotFoundError(`${username} not found!`);
    }

    return user;

  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {

    const results = await db.query(`
    SELECT m.id, m.to_username, m.body, m.sent_at, m.read_at,
     u.first_name, u.last_name, u.phone
      FROM messages AS m
      JOIN users AS u
      ON m.to_username = u.username
      WHERE m.from_username = $1`,
      [username]);

    const messages = results.rows;

    return messages.map(row => {
      return {
        id: row.id,
        to_user: {
          username: row.to_username,
          first_name: row.first_name,
          last_name: row.last_name,
          phone: row.phone
        },
        body: row.body,
        sent_at: row.sent_at,
        read_at: row.read_at
      };
    });

  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {

    const results = await db.query(`
    SELECT m.id, m.from_username, m.body, m.sent_at, m.read_at,
     u.first_name, u.last_name, u.phone
      FROM messages AS m
      JOIN users AS u
      ON m.from_username = u.username
      WHERE m.to_username = $1`,
      [username]);

    const messages = results.rows;

    return messages.map(row => {
      return {
        id: row.id,
        from_user: {
          username: row.from_username,
          first_name: row.first_name,
          last_name: row.last_name,
          phone: row.phone
        },
        body: row.body,
        sent_at: row.sent_at,
        read_at: row.read_at
      };
    });
  }
}


module.exports = User;
