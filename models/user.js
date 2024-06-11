const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    unique: true,
    minLength: 3,
    maxLength: 6,
    required: true,
  },
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
});

module.exports = model("User", userSchema);
