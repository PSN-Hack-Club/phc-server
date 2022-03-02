const mongoose = require('mongoose')

const connectDb = (handler) => async (req, res) => {
  if (mongoose.connections[0].readyState) {
    // Use current db connection
    return handler(req, res)
  }
  // Use new db connection
  await mongoose.connect(process.env.MONGODB_URL)
  return handler(req, res)
}

module.exports = connectDb
