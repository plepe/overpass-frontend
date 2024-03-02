module.exports = (url) => {
  if (!url || url.match(/\/\/[^\/]+$/)) { // url without path
    return false
  }

  if (url.match(/\/[^\/.]+$/)) { // last url part without '.'
    return false
  }

  if (url.match(/\.(php)(\?.*)?$/)) { // php script -> assume server
    return false
  }

  return true
}
