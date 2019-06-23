const rand = require('./rand')

function randomDays(){
  let result = []
  for(let i = 0; i < 7; i++) result.push(Boolean(rand(1)))
  return result
}

// creates a mock object with a set ID
function defaultProject(id){
  return {
    id, name: id.toString(), color: "#" + rand(10**6), estimatedDuration: rand(180),
    state: "done", days: randomDays()
  }
}

module.exports = defaultProject
