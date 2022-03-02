const utcTimeNow = () => {
  return new Date(new Date().toUTCString())
}

module.exports = { utcTimeNow }
