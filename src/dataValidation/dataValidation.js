const correctDataStructure = require('./correctDataStructure')
const validatePrimitive = require('./validatePrimitive')
const validateObject = require('./validateObject')
const lastModifiedSysNoteToDates = require('./lastModifiedSysNoteToDates')
const {mergeObjects} = require('../objectUtil')

function dataValidation(data){
  var correctedData = {}

  for(let [key, val] of Object.entries(data)){
    if(!correctDataStructure[key]){
      console.warn(`Incorrect key in data: ${key}`)
      continue
    }
    if(correctDataStructure[key].type === "object"){
      correctedData[key] = validateObject([key], val)
      if(correctedData[key].__lastModifiedSysNote){
        if(!correctedData.__lastModifiedSysNote) correctedData.__lastModifiedSysNote = {}
        correctedData.__lastModifiedSysNote[key] = correctedData[key].__lastModifiedSysNote
        delete correctedData[key].__lastModifiedSysNote
      }
    }
    else correctedData[key] = validatePrimitive([key], val)
  }

  if(correctedData.__lastModifiedSysNote){
    let newLastModifiedItems = lastModifiedSysNoteToDates(correctedData.__lastModifiedSysNote)
    delete correctedData.__lastModifiedSysNote

    if(!correctedData.lastModified) correctedData.lastModified = newLastModifiedItems
    else correctedData.lastModified = mergeObjects(correctedData.lastModified, newLastModifiedItems)
  }

  return correctedData
}

module.exports = dataValidation
