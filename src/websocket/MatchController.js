
const UserController = require("../controllers/UserController");
const WebSocketLoginController = require("./LoginController");

const User = require('../db/models/user');
const Figure = require('../db/models/figure');
const Match = require('../db/models/match');

// set a timout funtion to handle notifications every 10s
setInterval(handleNotificationMatch, 10000);


async function handleNotificationMatch() {
    console.log("notificando os matches");
    for (let i = 0; i < WebSocketLoginController.connections.length; i++) {
        if (WebSocketLoginController.connections[i].user) {
            let user = WebSocketLoginController.connections[i].user;
            // find all matches with that user
            let matches = await Match.find({ $or: [{ id_user_1: user.id_user }, { id_user_2: user.id_user }] });
            for(let j = 0; j< matches.length; j++){
                match = matches[j];
                if (match.id_user_1 == user.id_user) {
                    const otherUser = await User.findOne({ id_user: match.id_user_2 });
                    if (!match.state.state_notified.user_1) {
                        WebSocketLoginController.connections[i].ws.send(JSON.stringify({ type: "match", data: { notification: `match com ${otherUser.name}: ${match.state.description}` } }));
                        console.log(`notificando ${user.name} do match com ${otherUser.name}`);
                        match.state.state_notified.user_1 = true;
                        match.save();
                    }
                } else {
                    const otherUser = await User.findOne({ id_user: match.id_user_1 });
                    if (!match.state.state_notified.user_2) {
                        WebSocketLoginController.connections[i].ws.send(JSON.stringify({ type: "match", data: { notification: `match com ${otherUser.name}: ${match.state.description}` } }));
                        console.log(`notificando ${user.name} do match com ${otherUser.name}`);
                        match.state.state_notified.user_2 = true;
                        match.save();
                    }
    
                }
            }
        }
    }
}   