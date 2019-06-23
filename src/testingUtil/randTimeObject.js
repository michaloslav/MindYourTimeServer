const rand = require('./rand')

function randTimeObject(){
  return {
    h: rand(11), m: rand(59), pm: Boolean(rand(1))
  }
}

module.exports = randTimeObject
