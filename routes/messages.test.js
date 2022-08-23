"use strict";

const request = require("supertest");
// const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");



describe("Message Routes Test", function () {
  let m1;
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");
    await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });

    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155550090",
    });



    m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "from test1 to test2"
    });

    let m2 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "from test2 to test1"
    });

  });

  /** Get message by id */
  describe("GET /:id", function () {
    test("can get message by id", async function () {
      const user = await request(app)
        .post("/auth/login")
        .send({ username: "test1", password: "password" });

      let token = user.body.token;
      let response = await request(app).get(`/messages/${m1.id}`).send({ _token: token });

      expect(response.body).toEqual({
        message: {
          id: expect.any(Number),
          body: "from test1 to test2",
          sent_at: expect.any(String),
          read_at: null,
          from_user: expect.any(Object),
          to_user: expect.any(Object)
        }
      });
    });

  });

});

afterAll(async function () {
  await db.end();
});;