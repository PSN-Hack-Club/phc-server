require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Invite = require("./models/invite.model");

const PORT = 1337;

