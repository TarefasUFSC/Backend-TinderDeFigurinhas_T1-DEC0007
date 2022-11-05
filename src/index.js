const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const app = express();
const WebSocket = require("ws");

const path = require('path')

const mongoose = require('mongoose');
const UserController = require("./controllers/UserController");
const MatchController = require("./controllers/MatchController");
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
  console.log("New connection");
  ws.on("message", async function incoming(message) {
    var msg = JSON.parse(message);
    //console.log(msg);
    switch (msg.type) {
      case "login":
        //console.log("Login");
        const rsp = await UserController.login(msg.data);
        if(rsp.error){
          ws.send(JSON.stringify({type:"login",data:{error:rsp.error}}));
        }else{
          ws.send(JSON.stringify({type:"login",data:{user:rsp}}));
        }
        break;
      case "aceita_match":
        // aqui vai ser chamado quando um user clicar em confirmar um match
        // vai receber na msg as figurinhas que ele esta confirmando, as quais ficarão prometidas.
        // isso acontece pois na sugestão existe a possibilidade de um ter mais cartas que o outro.
        const aceppt_match_result = await MatchController.acceptMatch(msg.data);
        break;
    }
  });

  ws.send(JSON.stringify({msg:"Roi, client-kun"}));
});

app.use(cors());
app.use(express.json());
app.use(routes);

app.use('/public', express.static(path.join(__dirname, '/public')))

app.listen(3333, "0.0.0.0");
