const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const postRoutes = require("./routes/post");
const adminRoutes = require("./routes/admin");

const User = require("./models/user");

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  User.findById("666863be67669a19d8514cc0").then((user) => {
    req.user = user;
    next();
  });
});

app.use("/admin", adminRoutes);
app.use(postRoutes);

mongoose
  .connect(process.env.MONGODB_URL)
  .then((res) => {
    console.log(res);
    app.listen(8080);
    console.log("connected to mongodb");

    return User.findOne().then((user) => {
      if (!user) {
        User.create({
          username: "BoSwar",
          email: "mkks@gmail.com",
          password: "mkks.mkks123",
        });
      }
      return user;
    });
  })
  .then((result) => console.log(result))
  .catch((err) => console.log(err));
