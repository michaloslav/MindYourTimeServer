const rand = require('./rand')
const randTimeObject = require('./randTimeObject')

// creates a mock object with a set ID
function project(id){
  return {
    id, name: id.toString(), color: "#" + rand(10**6), estimatedDuration: rand(180),
    state: "done", plannedTime: {start: randTimeObject(), end: randTimeObject()}
  }
}

module.exports = project
