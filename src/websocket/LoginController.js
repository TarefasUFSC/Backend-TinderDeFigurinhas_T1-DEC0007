let connections = [];

const UserController = require("../controllers/UserController");

module.exports = {
    connections,
    async login(ws,data) {
        const rsp = await UserController.login(data);
        if(rsp.error){
          ws.send(JSON.stringify({type:"login",data:{error:rsp.error}}));
        }else{
          ws.send(JSON.stringify({type:"login",data:{user:rsp}}));
        }
        connections.push({ws:ws,user:rsp});
    }
}