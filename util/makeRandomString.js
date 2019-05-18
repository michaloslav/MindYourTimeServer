module.exports = function makeRandomString(length = 32){
  let string = ""
  while(length > 0){
    string += Math.random().toString(36).substr(2)
    length -= 10
  }

  string.substr(0, length)

  return string
}
