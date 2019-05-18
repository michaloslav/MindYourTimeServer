const dataValidation = require('./dataValidation')
const {areIdenticalObjects} = require('./objectUtil')

/*
PSEUDOCODE:
start with the dbData
go over each localData item (except for lastModified)
compare each items lastModified to the one in the DB, pick the newer data
if the localData item is newer, insert its lastModified into the db
(handle undefined the whole time)
*/

/*
  dbObjects, localObjects & mergedData are all the full objects
  key is "projects" or "breaks"
*/

function mergeProjectsOrBreaks(dbData, localData, mergedData, key, resetInProgress = false){
  // handle undefined
  if(!localData.lastModified[key]) return mergedData
  if(!mergedData[key]) mergedData[key] = {}
  if(!mergedData.lastModified[key]) mergedData.lastModified[key] = {}

  // check if an object in localData should be deleted
  for(let [localLastModifiedObjId, localLastModifiedObj] of Object.entries(localData.lastModified[key])){
    if(
      // check if the user deleted an object
      (
        Object.keys(localLastModifiedObj).length === 1 &&
        ( // handle an object being deleted before its lastModified is in the database
          !dbData.lastModified[key] ||
          !dbData.lastModified[key][localLastModifiedObjId] ||
          localLastModifiedObj.id > dbData.lastModified[key][localLastModifiedObjId].id
        )
      ) ||
      // check if the user performed a reset on another device and the object is older than the reset
      (
        localLastModifiedObj.id < dbData.lastReset &&
        ( // also make sure there isn't an object with the same id in dbData
          !dbData.lastModified[key] ||
          !dbData.lastModified[key][localLastModifiedObjId]
        )
      ) ||
      // check if the user deleted the project on another device while the one that is syncing was offline
      (
        dbData.lastModified[key] && dbData.lastModified[key][localLastModifiedObjId] && // handle undefined
        Object.keys(dbData.lastModified[key][localLastModifiedObjId]).length === 1 &&
        localLastModifiedObj.id < dbData.lastModified[key][localLastModifiedObjId].id
      )
    ){
      // now remove from both localData and mergedData (if it's present)

      // find the index
      let localDataIndex = localData[key].findIndex(obj => obj.id === parseInt(localLastModifiedObjId))
      let mergedDataIndex = mergedData[key].findIndex(obj => obj.id === parseInt(localLastModifiedObjId))


      // delete from the array, only leave id in the lastModified
      if(localDataIndex >= 0){
        localData[key].splice(localDataIndex, 1)
        localData.lastModified[key][localLastModifiedObjId] = {id: localLastModifiedObj.id}
      }
      if(mergedDataIndex >= 0){
        mergedData[key].splice(mergedDataIndex, 1)
        mergedData.lastModified[key][localLastModifiedObjId] = {id: localLastModifiedObj.id}
      }

      //console.log("Deleted " + localLastModifiedObjId);
    }
  }

  for(let [index, localObject] of localData[key].entries()){
    let objectId = localObject.id

    if(/*!mergedData.lastModified[key][objectId] || */!localData.lastModified[key][objectId]) continue

    let mergedDataIndex = mergedData[key].findIndex(obj => obj.id === objectId)

    // if the object was just added...
    if(mergedDataIndex < 0){
      //console.log("Added " + localObject.name);
      mergedData[key].splice(index, 0, localObject)

      // save last modified
      mergedData.lastModified[key][localObject.id] = {}
      if(localData.lastModified[key][objectId]){
        for(let [lastModifiedKey, lastModifiedVal] of Object.entries(localData.lastModified[key][objectId])){
          let dateString = typeof lastModifiedVal === "string" ? lastModifiedVal : lastModifiedVal.toISOString()
          mergedData.lastModified[key][localObject.id][lastModifiedKey] = dateString
        }
      }

      continue
    }

    // if a property was modified
    for(let localObjectKey of Object.keys(localObject)){
      if(!localData.lastModified[key][objectId][localObjectKey]) continue
      if(
        !dbData.lastModified[key] ||
        !dbData.lastModified[key][objectId] ||
        !dbData.lastModified[key][objectId][localObjectKey] ||
        localData.lastModified[key][objectId][localObjectKey] > dbData.lastModified[key][objectId][localObjectKey]
      ){
        // handle undefined
        if(!mergedData[key]) mergedData[key] = {}
        if(!mergedData[key][mergedDataIndex]) mergedData[key][mergedDataIndex] = {}

        mergedData[key][mergedDataIndex][localObjectKey] = localObject[localObjectKey]

        if(!mergedData.lastModified[key][objectId]) mergedData.lastModified[key][objectId] = {}
        let dateObjOrString = localData.lastModified[key][objectId][localObjectKey]
        let dateString = typeof dateObjOrString === "string" ? dateObjOrString : dateObjOrString.toISOString()
        mergedData.lastModified[key][objectId][localObjectKey] = dateString
      }
    }
  }

  // if the data is being reset and there are objects in the db that are older than the reset /*and that don't exist in localData, delete them*/
  if(resetInProgress && dbData.lastModified[key]){
    for(let [dbLastModifiedObjId, dbLastModifiedObj] of Object.entries(dbData.lastModified[key])){
      if(
        /*(!localData.lastModified[key] || !localData.lastModified[key][dbLastModifiedObjId]) &&*/
        dbLastModifiedObj.id < localData.lastReset
      ){
        // find the index
        let mergedDataIndex = mergedData[key].findIndex(obj => obj.id == dbLastModifiedObjId)
        if(mergedDataIndex < 0) continue // -1 handling

        // delete
        mergedData[key].splice(mergedDataIndex, 1)
        if(mergedData.lastModified[key][dbLastModifiedObjId]){
          delete mergedData.lastModified[key][dbLastModifiedObjId]
        }
      }
    }
  }

  // handle reordering
  mergedData[key].sort((a, b) => a.order > b.order)

  return mergedData
}

module.exports = function mergeData(dbData, localData){
  localData = dataValidation(localData) // validate first

  console.log("\nDB:", JSON.stringify(dbData), "\nLocal:", JSON.stringify(localData), "\n");
  var mergedData = JSON.parse(JSON.stringify(dbData))

  // handle undefined
  if(!localData.lastModified || !Object.keys(localData.lastModified).length){
    let modifiedData = {}
    return { mergedData, modifiedData }
  }
  if(!mergedData.lastModified) mergedData.lastModified = {}

  // detect a reset
  if(
    (!dbData.lastReset && localData.lastReset) ||
    (localData.lastReset && localData.lastReset > dbData.lastReset) ||
    (localData.projects && !localData.projects.length && dbData.projects && dbData.projects.length)
  ){
    //console.log("reset");
    var resetInProgress = true
  }

  for(let el of Object.keys(localData)){
    switch (el) {
      case "lastModified":
        continue
      case "projects":
        mergedData = mergeProjectsOrBreaks(dbData, localData, mergedData, "projects", resetInProgress)
        break
      case "breaks":
        mergedData = mergeProjectsOrBreaks(dbData, localData, mergedData, "breaks", resetInProgress)
        break
      case "defaultProjects":
        mergedData = mergeProjectsOrBreaks(dbData, localData, mergedData, "defaultProjects")
        break
      case "settings":
        // handle undefined
        // if there isn't a last modified field in localData, it means the settings are probably default -> don't save it
        if(!localData.lastModified.settings) continue
        if(!mergedData.settings) mergedData.settings = {}
        if(!mergedData.lastModified.settings) mergedData.lastModified.settings = {}


        Object.keys(localData.settings).forEach(settingsKey => {
          // if the localData item is newer or isn't in the db...
          if(
            !dbData.lastModified.settings ||
            !dbData.lastModified.settings[settingsKey] ||
            localData.lastModified.settings[settingsKey] > dbData.lastModified.settings[settingsKey]
          ){
            mergedData.settings[settingsKey] = localData.settings[settingsKey]

            // if lastModified is set
            if(localData.lastModified.settings && localData.lastModified.settings[settingsKey]){
              let dateStringOrObj = localData.lastModified.settings[settingsKey]
              let dateString = typeof dateStringOrObj === "string" ? dateStringOrObj : dateStringOrObj.toISOString()
              mergedData.lastModified.settings[settingsKey] = dateString
            }
          }
        })
        break
      case "lastReset":
        if(!dbData.lastReset || localData.lastReset > dbData.lastReset){
          mergedData.lastReset = localData.lastReset
        }
        break
      default:
        // if lastModified is not defined, it's probably default
        if(!localData.lastModified[el]) continue

        // if the item in localData is newer (or if it doesn't appear in the db), pick it
        if(
          !dbData.lastModified[el] ||
          localData.lastModified[el] > dbData.lastModified[el]
        ){
          // if the object is a date, convert it to a string first (handle undefined properties first in case something is explicitely undefined)
          if(localData[el] && typeof localData[el].getMonth === "function"){
            mergedData[el] = localData[el].toISOString()
          }
          else mergedData[el] = localData[el]

          // save the lastModified
          let dateStringOrObj = localData.lastModified[el]
          let dateString = typeof dateStringOrObj === "string" ? dateStringOrObj : dateStringOrObj.toISOString()
          mergedData.lastModified[el] = dateString
        }
    }
  }

  // only return the values that have changed (better performance)
  let modifiedData = {}
  Object.keys(mergedData).forEach(el => {
    if(typeof mergedData[el] === "object" && el !== "lastReset"){
      if(!areIdenticalObjects(mergedData[el], dbData[el])) modifiedData[el] = mergedData[el]
    }
    else{
      if(mergedData[el] !== dbData[el]) modifiedData[el] = mergedData[el]
    }
  })

  console.log(JSON.stringify(mergedData), JSON.stringify(modifiedData), "\n\n")
  return { mergedData, modifiedData }
}
