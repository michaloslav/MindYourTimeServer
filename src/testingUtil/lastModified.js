const timeStrings = require('./timeStrings')

function lastModified(keys, ageIndex){
  let timeString = timeStrings[ageIndex]

  return keys.reduce((acc, key) => ({...acc, [key]: timeString}), {})
}

// create a lastModified object for an with a given age
// ageIndex = index within the timeStrings array (indicates age, the greater the older)
function projectLastModified(ageIndex){
  return lastModified(["id", "name", "color", "state", "estimatedDuration", "plannedTime"], ageIndex)
}

function defaultProjectLastModified(ageIndex){
  return lastModified(["id", "name", "color", "state", "estimatedDuration", "days"], ageIndex)
}

module.exports = {projectLastModified, defaultProjectLastModified}
