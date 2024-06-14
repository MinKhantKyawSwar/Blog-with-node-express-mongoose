const bcrypt = require("bcrypt");
const User = require("../models/user");

const nodeMailer = require("nodemailer");
const dotenv = require("dotenv").config();

const transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_MAIL,
    pass: process.env.MAIL_PASSWORD,
  },
});

// render register page
exports.getRegisterPage = (req, res) => {
  let message = req.flash("regError");
  if (message.length > 0) {
    message = message[0];
  } else {
    message: null;
  }
  res.render("auth/register", { title: "Register", errorMsg: message });
};

//handle register page
exports.registerAccount = (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (user) {
        req.flash(
          "regError",
          "You already have an account with this email address!"
        );
        return res.redirect("/register");
      }
      return bcrypt
        .hash(password, 10)
        .then((hashedPassword) => {
          return User.create({
            email,
            password: hashedPassword,
          });
        })
        .then((_) => {
          res.redirect("/login");
          transporter.sendMail(
            {
              from: process.env.SENDER_MAIL,
              to: email,
              subject: "Register Successful",
              html: "<h1>Your account is successfully registered.</h1><p>Create wonderful blogs here in Blog.io</p>",
            },
            (err) => console.log(err)
          );
        });
    })
    .catch((err) => console.log(err));
};

//render login page
exports.getLoginPage = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message: null;
  }
  res.render("auth/login", { title: "Login", errorMsg: message });
};

//handle login
exports.postLoginData = (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        req.flash("error", "Check Your Information and Try Again!");
        return res.redirect("/login");
      }
      bcrypt
        .compare(password, user.password)
        .then((isMatch) => {
          if (isMatch) {
            req.session.isLogin = true;
            req.session.userInfo = user;
            return req.session.save((err) => {
              res.redirect("/");
              console.log(err);
            });
          }
          res.redirect("/login");
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

//handle logout
exports.logout = (req, res) => {
  req.session.destroy((_) => {
    res.redirect("/");
  });
};
