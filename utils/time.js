const utcTimeNow = () => {
  return new Date(new Date().toUTCString())
}

export { utcTimeNow }
