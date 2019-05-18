function areIdenticalObjects(obj1, obj2){
  if(!obj2) return false

  let keys
  if(Array.isArray(obj1)) keys = obj1.keys()
  else keys = Object.keys(obj1)

  for(let key of keys){
    if(typeof obj1[key] === "object"){
      if(!areIdenticalObjects(obj1[key], obj2[key])) return false
    }
    else{
      if(obj1[key] !== obj2[key]) return false
    }
  }

  return true
}

function mergeObjects(oldData, newData){
  let mergedData = JSON.parse(JSON.stringify(oldData))
  for(let [key, val] of Object.entries(newData)){
    if(typeof val === "object" && typeof val.getTime !== "function"){
      let oldVal = oldData[key]
      if(!oldVal) oldVal = {} // handle undefined
      mergedData[key] = mergeObjects(oldVal, val)
    }
    else mergedData[key] = val
  }
  return mergedData
}

module.exports = {areIdenticalObjects, mergeObjects}
