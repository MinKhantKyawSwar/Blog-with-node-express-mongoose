const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    minLength: 4,
    required: true,
  },
  username: {
    type: String,
    minLength: 3,
    unique: true,
  },
  resetToken: String,
  tokenExpiration: Date,
});

module.exports = model("User", userSchema);
