const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;

const app = express()
  .get("/", (req, res) => res.send("Nothing to see here!"))
  .listen(PORT)

const io = socketIO(app)

const handleSocketIO = require('./handleSocketIO')
io.on('connection', handleSocketIO);

const pinging = require('./util/pinging')
pinging()

module.exports = app;
