let connections = [];

const User = require('../db/models/user');
const UserController = require("../controllers/UserController");

setInterval(function ping() {
    console.log("ping", connections.length);
    // connections = connections.filter(connection => {
    //     const {ws,user} = connection;
    //     if (ws.isAlive === false) {
    //         ws.terminate();
    //         return false;
    //     }
    //     return true;
    // });
    // check if ws is still connected, ifnot pull from connections
    const cons = connections;
    cons.forEach(connection => {
        const {ws,user} = connection;
        if (ws.isAlive === false) {
            ws.terminate();
            connections = connections.filter(c => c !== connection);
            return;
        }
        ws.isAlive = false;
        ws.ping(() => {});
    });
}, 5000);

module.exports = {
    connections,
    async login(ws, data) {
        const rsp = await UserController.login(data);
        if (rsp.error) {
            ws.send(JSON.stringify({ type: "login", data: { error: rsp.error } }));
        } else {
            ws.send(JSON.stringify({ type: "login", data: { user: rsp } }));
        }
        //check if user is already in connections
        connections = connections.filter(connection => {
            if (connection.user.id_user == rsp.id_user) {
                connection.ws.terminate();
                return false;
            }
            return true;
        });
        connections.push({ ws: ws, user: rsp });
        

    },
    async loggedConnection(ws, data) {
        const user = await User.findOne({ id_user: data.id_user });
        if(user){
            
        const dt = {
            id_user: user.id_user,
            name: user.name,
            photo: user.photo,
            unique_figs: user.unique_figs,
            repeated_figs: user.repeated_figs,
        }
        //check if user is already in connections
        connections = connections.filter(connection => {
            if (connection.user.id_user == user.id_user) {
                connection.ws.terminate();
                return false;
            }
            return true;
        });
        connections.push({ ws: ws, user: user });
        }
        else{
            console.log("User not found");
        }
    }
}