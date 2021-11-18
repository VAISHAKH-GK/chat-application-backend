var express = require('express');


var app = express();


var server = require("http").createServer(app);
const { Server } = require("socket.io");
var io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});


module.exports = io