const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const app = express();
const WebSocket = require("ws");

const path = require('path')

const mongoose = require('mongoose');
const UserController = require("./controllers/UserController");
const MatchController = require("./controllers/MatchController");
const WebSocketLoginController = require("./websocket/LoginController");
const WebSocketMatchController = require("./websocket/MatchController");
// get env variables
require('dotenv').config();

mongoose.connect("mongodb+srv://gourmet:"+process.env.MONGODB_PSW+"@clusterdec0007.itfze4v.mongodb.net/DEC0007_T1?retryWrites=true&w=majority", { useNewUrlParser: true })

const database = mongoose.connection;
database.on('error',(e)=>{console.log(e);})
database.once('connected',()=>{console.log("Db conectado");})

//const server = require("http").createServer(app);
const wss = new WebSocket.Server(
  { port: 8080, host: "0.0.0.0" },
  function () {
    console.log(
      "Iniciando websocket na porta 8080"
    );
  }
);

wss.on("connection", function connection(ws) {
  //console.log(wss.clients);
  console.log("New connection");
  ws.on("message", async function incoming(message) {
    var msg = JSON.parse(message);
    //console.log(msg);
    switch (msg.type) {
      case "loggedConnection":
        console.log("loggedConnection");
        WebSocketLoginController.loggedConnection(ws, msg.data);
      break;
      case "login":
        //console.log("Login");
        await WebSocketLoginController.login(ws, msg.data);
        //console.log(WebSocketLoginController.connections);
        break;
      // case "aceita_match":
      
      //   break;
    }
  });

  ws.send(JSON.stringify({msg:"Roi, client-kun"}));
});



app.use(cors());
app.use(express.json());
app.use(routes);

app.use('/public', express.static(path.join(__dirname, '/public')))

app.listen(3333, "0.0.0.0");
