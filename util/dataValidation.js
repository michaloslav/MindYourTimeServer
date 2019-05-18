const {mergeObjects} = require('./objectUtil')
const correctDataStructure = require('./correctDataStructure')
const defaultSettings = require("./defaultSettings")

function lastModifiedSysNoteToDates(sysNote){
  var lastModified = {}
  Object.entries(sysNote).forEach(([key, val]) => {
    if(typeof val === "object") lastModified[key] = lastModifiedSysNoteToDates(val)
    else lastModified[key] = new Date()
  })
  return lastModified
}

function getCorrectDataStructureSection(keys){
  if(typeof keys === "string") console.warn("Keys must be an array!")

  var warningMessage = `Incorrect property detected in data: ${keys.join(".")} should not be defined`
  try{
    var result = keys.reduce((section, key) => section[key], correctDataStructure)
  }
  catch(e){
    console.warn(warningMessage)
    console.warn(e)
  }
  if(!result) console.warn(warningMessage)

  return result
}

function validatePrimitive(keys, val){
  var correctDataStructureSection = getCorrectDataStructureSection(keys)
  if(!correctDataStructureSection) return

  let expectedType = correctDataStructureSection.type
  let actualType = typeof val

  if(expectedType === actualType ||
    (// allow numbers to be in the form of a string
      expectedType === "number" &&
      actualType === "string" &&
      !isNaN(parseFloat(val))
    ) ||
    (// allows bools in the form of a strings
      expectedType === "boolean" &&
      actualType === "string" &&
      (val === "true" || val === "false")
    )
  ) return val
  else console.warn(`Incorrect type detected in data: ${keys.join(".")} is '${val}' which is of type ${actualType}, should be of type ${expectedType}`)
}

function validateObject(keys, val){
  var correctedVal

  var correctDataStructureSection = getCorrectDataStructureSection(keys)
  if(!correctDataStructureSection) return

  if(correctDataStructureSection.isArray){
    correctedVal = []

    if(!Array.isArray(val)) return

    for(let el of val){
      if(typeof el === "object"){
        correctedVal.push(validateObject([...keys, "elements"], el))
      }
      else{
        correctedVal.push(validatePrimitive([...keys, "elements"], el))
      }
    }
  }
  else{
    correctedVal = {}

    if(typeof val !== "object" || val === null) return

    for(let [objKey, objVal] of Object.entries(val)){

      // get the expectedType (first try the key, then __any__, if both fails, throw an error)
      let expectedType, keyToPass
      if(correctDataStructureSection.properties[objKey]){
        expectedType = correctDataStructureSection.properties[objKey].type
        keyToPass = objKey
      }
      else{
        if(correctDataStructureSection.properties.__any__){
          expectedType = correctDataStructureSection.properties.__any__.type
          keyToPass = "__any__"
        }
        else{
          console.warn(`Incorrect property in data: ${keys.join(".")}.${objKey} should not be defined `)
          continue
        }
      }

      if(expectedType === "object"){
        correctedVal[objKey] = validateObject([...keys, "properties", keyToPass], objVal)
        if(correctedVal[objKey] && correctedVal[objKey].__lastModifiedSysNote){
          if(!correctedVal.__lastModifiedSysNote) correctedVal.__lastModifiedSysNote = {}
          correctedVal.__lastModifiedSysNote[objKey] = correctedVal[objKey].__lastModifiedSysNote
          delete correctedVal[objKey].__lastModifiedSysNote
        }
      }
      else{
        correctedVal[objKey] = validatePrimitive([...keys, "properties", keyToPass], objVal)
      }
    }

    // check for missing values
    for(let [propertyKey, propertyVal] of Object.entries(correctDataStructureSection.properties)){
      if(propertyVal.required && typeof val[propertyKey] === "undefined"){
        console.warn(`Property missing in data: ${keys.join(".")}.${propertyKey} is not defined`)

        // figure out what property to use
        let propertyValToSet
        if(keys.length === 1 && keys[0] === "settings") propertyValToSet = defaultSettings[propertyKey]

        if(typeof propertyValToSet !== "undefined"){
          console.log(`${keys.join(".")}.${propertyKey} automatically set to ${propertyValToSet}`)
          correctedVal[propertyKey] = propertyValToSet

          if(!correctedVal.__lastModifiedSysNote) correctedVal.__lastModifiedSysNote = {}
          correctedVal.__lastModifiedSysNote[propertyKey] = true
        }
      }
    }
  }

  return correctedVal
}

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
