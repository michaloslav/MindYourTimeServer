module.exports = function makeRandomString(length = 32){
  let string = ""
  let lengthLeft = length
  while(lengthLeft > 0){
    string += Math.random().toString(36).substr(2, 10)
    lengthLeft -= 10
  }

  return string.substr(0, length)
}
