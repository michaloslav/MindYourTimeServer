const clientId = require('../sensitive/google')

const {OAuth2Client} = require('google-auth-library');
const oAuthclient = new OAuth2Client(clientId);

module.exports = async function verifyIdToken(idToken){
  let ticket
  try{
    ticket = await oAuthclient.verifyIdToken({
      idToken,
      audience: clientId
    })
  }
  catch(e){
    throw new Error(e)
    return
  }

  let payload = ticket.payload

  if(
    payload.aud !== clientId ||
    (
      payload.iss !== "accounts.google.com" &&
      payload.iss !== "https://accounts.google.com"
    )
  ){
    throw new Error("Authentication failed: invalid aud or iss")
    return
  }

  return payload
}
