var mongojs = require('mongojs');

const {dbUser, dbPw} = require('../sensitive/mongo')
const dbURI = `mongodb://${dbUser}:${dbPw}@ds137540.mlab.com:37540/mindyourtime`

db = mongojs(dbURI)

module.exports = function mng(collection, command, query = {}, otherQuery = {}){
  switch(command){
    case "update":
      return new Promise((resolve, reject) => {
        db[collection][command](query, otherQuery, (error, result) => {
          if(error){
            reject(error);
          }
          else{
            resolve(result);
          }
        })
      });
      break
    default:
      return new Promise((resolve, reject) => {
        db[collection][command](query, (error, result) => {
          if(error){
            reject(error);
          }
          else{
            resolve(result);
          }
        })
      });
  }
}
