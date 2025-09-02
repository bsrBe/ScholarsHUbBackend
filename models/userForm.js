const e = require("express");
const mongoose = require("mongoose");

const userFormSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
     trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
     trim: true
  },

  phone_number: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 13,
     trim: true
  },
  telegram_user_name: {
    type: String,
    required: true,
     trim: true
  },
  educational_status: {
    type: String,
    required: true,
    enum: [
      "HighSchool",
      "Bachelor",
      "Master's",
      "PhD",
      "work professional",
    ],
    default: "",
     trim: true
  },
  destination_country: {
    type: String,
    required: true,
    enum: [
      "Canada",
      "United States",
      "United Kingdom",
      "Australia",
      "Germany",
      "Romania",
    ],
    default: "",
     trim: true
  },
  client_document: {
    type: String,
    required: true,
    
  },
  additional_information: {
    type: String,
    required: false,
     trim: true
  }
});
module.exports = mongoose.model("UserForm", userFormSchema);

