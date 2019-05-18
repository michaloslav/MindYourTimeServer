// import the util functions
const makeRandomString = require('./util/makeRandomString')
const mergeData = require('./util/mergeData')
const mng = require('./util/mng')
const verifyIdToken = require('./util/verifyIdToken')

/*const tester = require('./testing')
tester()*/

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
      catch(e){
        console.log("Connection verification failed: ", e);
        socket.emit("errorU", {type: "login"})
        return
      }

      socket.join(id)

      query = {_id: id}
    }
    // when the user connects with an accessToken
    else query = {accessToken: data.accessToken}


    socket.join(id)

    // initial update
    mng("data", "find", query)
      .then(async currentData => {

        // if the user isn't in the db yet...
        if(!currentData.length){

          // if they're connecting with OAuth, save their data
          if(type === "OAuth"){

            // generate an accessToken (used to authenticate the user), make sure it's unique
            let haveUniqueToken = false, accessToken
            while(!haveUniqueToken){
              accessToken = makeRandomString()
              await mng("data", "find", {accessToken})
                .then(results => {
                  if(!results.length) haveUniqueToken = true
                })
            }

            mng("data", "insert", {_id: id, accessToken, ...localData})
              .then(data => {
                socket.emit("success", {type: "connectInsert", accessToken})
              })
              .catch(err => {
                console.log(err);
                socket.emit("errorU", {type: "connectInsert"})
              })
          }

          // if they're trying to connect with an accessToken but they're not in the db, the token is invalid
          else{
            socket.emit("errorU", {type: "invalidAccessToken"})
            return
          }
        }

        // if the user is already in the db...
        else{

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

          mng("data", "update", {_id: id}, mergedData)
            .then(data => {
              socket.emit("success", {type: "connectUpdate", accessToken})

              // emit the change
              delete mergedData._id
              delete mergedData.accessToken
              socket.emit("connectUpdate", mergedData)

              // emit the change to other sockets in the room
              socket.broadcast.to(id).emit("update", mergedData)
            })
            .catch(err => {
              console.log(err);
              socket.emit("errorU", {type: "connectUpdate"})
            })
        }
      })
      .catch(err => {
        console.log(err);
        socket.emit("errorU", {type: "connectUpdate"})
      })
  })

  // update the data in the database
  socket.on("update", async data => {
    let accessToken = data.accessToken
    let newData = data.data

    // find the current data
    mng("data", "find", {accessToken})
      .then(currentData => {
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

        mng("data", "update", {accessToken}, mergedData)
          .then(updateData => {
            socket.emit("success", {type: "update"})

            // emit the change to other sockets in the room
            socket.broadcast.to(currentData[0]._id).emit("update", mergedData)
          })
          .catch(err => {
            console.log(err);
            socket.emit("errorU", {type: "update"})
          })
      })
      .catch(err => {
        console.log(err);
        socket.emit("errorU", {type: "update"})
      })
  })

  // ("disconnect" is reserved)
  socket.on("disconnectU", data => {
    let { accessToken } = data

    //console.log("disconnectU", accessToken);

    mng("data", "find", {accessToken})
      .then(data => {
        if(!data.length){
          socket.emit("errorU", {type: "invalidAccessToken"})
          return
        }

        socket.leave(data[0]._id)

        socket.emit("success", {type: "disconnect"})

      })
      .catch(e => {
        console.log(e);
        socket.emit("errorU", {type: "disconnect"})
      })
  })

  socket.on("checkForUpdates", data => {
    //console.log(data);
  })

  socket.on('error', err => {
    console.log(err);
  });
}
