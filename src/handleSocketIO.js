// import the util functions
const makeRandomString = require('./makeRandomString')
const mergeData = require('./mergeData')
const mng = require('./mng')
const verifyIdToken = require('./verifyIdToken')

module.exports = function handleSocketIO(socket){

  socket.on("connectInit", async data => {

    let { type, localData } = data

    //console.log("connectInit", type, localData);

    let id, query
    // when the user connects with OAuth
    if(type === "OAuth"){
      let idToken = data.idToken

      try{
        const payload = await verifyIdToken(idToken)
        id = payload.sub
      }
      catch(err){
        console.log("Connection verification failed: ", err);
        socket.emit("errorU", {type: "login"})
        return
      }

      socket.join(id)

      query = {_id: id}
    }
    // when the user connects with an accessToken
    else query = {accessToken: data.accessToken}


    socket.join(id)

    // is initial update?
    try{
      let currentData = await mng("data", "find", query)

      // if the user isn't in the db yet...
      if(!currentData.length){

        try{
          // if they're connecting with OAuth, save their data
          if(type === "OAuth"){

            // generate an accessToken (used to authenticate the user), make sure it's unique
            let haveUniqueToken = false, accessToken
            while(!haveUniqueToken){
              accessToken = makeRandomString()

              let results = await mng("data", "find", {accessToken})

              if(!results.length) haveUniqueToken = true
            }

            let data = await mng("data", "insert", {_id: id, accessToken, ...localData})

            socket.emit("success", {type: "connectInsert", accessToken})
          }

          // if they're trying to connect with an accessToken but they're not in the db, the token is invalid
          else{
            socket.emit("errorU", {type: "invalidAccessToken"})
            return
          }
        }
        catch(err){
          console.log(err);
          socket.emit("errorU", {type: "connectInsert"})
          return
        }
      }

      // if the user is already in the db...
      else{

        try{
          if(type === "accessToken"){
            id = currentData[0]._id
            socket.join(id)
          }
          let accessToken = currentData[0].accessToken

          let { mergedData, modifiedData } = mergeData(currentData[0], localData)

          // if there is nothing to update...
          if(!Object.keys(modifiedData).length){
            socket.emit("success", {type: "connectUpdate", details: "nothing to update", accessToken})
            socket.emit("connectUpdate", mergedData)
            return
          }

          let data = await mng("data", "update", {_id: id}, mergedData)

          socket.emit("success", {type: "connectUpdate", accessToken})

          // emit the change
          delete mergedData._id
          delete mergedData.accessToken
          socket.emit("connectUpdate", mergedData)

          // emit the change to other sockets in the room
          socket.broadcast.to(id).emit("update", mergedData)
        }
        catch(err){
          console.log(err);
          socket.emit("errorU", {type: "connectUpdate"})
          return
        }
      }
    }
    catch(err){
      console.log(err);
      socket.emit("errorU", {type: "connectInit"})
      return
    }
  })

  // update the data in the database
  socket.on("update", async data => {
    let accessToken = data.accessToken
    let newData = data.data

    try{
      // find the current data
      let currentData = await mng("data", "find", {accessToken})

      // if the user isn't in the db, the accessToken is invalid
      if(!currentData.length){
        socket.emit("errorU", {type: "invalidAccessToken"})
        return
      }

      let { mergedData, modifiedData } = mergeData(currentData[0], newData)
      //console.log("update", mergedData);

      // if there is nothing to update...
      if(!Object.keys(modifiedData).length){
        socket.emit("success", {type: "update", details: "nothing to update"})
        return
      }

      let updateData = await mng("data", "update", {accessToken}, mergedData)

      socket.emit("success", {type: "update"})

      // emit the change to other sockets in the room
      socket.broadcast.to(currentData[0]._id).emit("update", mergedData)
    }
    catch(err){
      console.log(err);
      socket.emit("errorU", {type: "update"})
      return
    }
  })

  // ("disconnect" is reserved)
  socket.on("disconnectU", async data => {
    let { accessToken } = data

    //console.log("disconnectU", accessToken);

    try{
      let data = await mng("data", "find", {accessToken})

      if(!data.length){
        socket.emit("errorU", {type: "invalidAccessToken"})
        return
      }

      socket.leave(data[0]._id)

      socket.emit("success", {type: "disconnect"})
    }
    catch(err){
      console.log(err);
      socket.emit("errorU", {type: "disconnect"})
      return
    }
  })

  socket.on("checkForUpdates", data => {
    //console.log(data);
  })

  socket.on('error', err => {
    console.log(err);
  });
}
