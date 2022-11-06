const User = require('../db/models/user');
const Figure = require('../db/models/figure');
const Match = require('../db/models/match');
const geolib = require('geolib');
const { v4: uuidv4 } = require('uuid');


async function verificaMatch(change) {
   //console.log("verificaMatch start");
    const alteredUser = await User.findById({ _id: change.documentKey._id });
   //console.log("alteredUser", alteredUser.name, alteredUser.last_login_position);
    const borders = await geolib.getBoundsOfDistance(
        { latitude: alteredUser.last_login_position.lat, longitude: alteredUser.last_login_position.lng },
        process.env.MAX_MATCH_RADIUS_METERS
    );
   //console.log("borders", borders);
    //find users in the same area
    const usersWithinRadius = await User.find({
        last_login_position: {
            $geoWithin: {
                $box: [
                    [borders[0].latitude, borders[0].longitude],
                    [borders[1].latitude, borders[1].longitude],
                ]
            }
        }
    });

    // delete old matches from alteredUser
    const old_matches = await Match.find({ $or: [{ id_user_1: alteredUser.id_user }, { id_user_2: alteredUser.id_user }] });
    for (let i = 0; i < old_matches.length; i++) {
        if ((!old_matches[i].state.state_accepted.user_1 || !old_matches[i].state.state_accepted.user_2) && old_matches[i].state.progress == 0) {
            deleteMatch(old_matches[i].id_match);
        }
    }

    //find matches
    for (let i = 0; i < usersWithinRadius.length; i++) {
        const not_prom_figs_altered_user = alteredUser.repeated_figs.filter((fig) => fig.is_promissed == false);
        const user = usersWithinRadius[i];
        if (user.id_user != alteredUser.id_user) {
            //find figures that are promissed to the user
            const not_prom_figs_user = user.repeated_figs.filter((fig) => fig.is_promissed == false);

            // filter to have only one figure of each type
            const not_prom_figs_altered_user_filtered = not_prom_figs_altered_user.filter((fig, index, self) =>
                index === self.findIndex((t) => (
                    t.id_figure === fig.id_figure
                ))
            );
            const not_prom_figs_user_filtered = not_prom_figs_user.filter((fig, index, self) =>
                index === self.findIndex((t) => (
                    t.id_figure === fig.id_figure
                ))
            );

            //find figures that alteredUser doesn't have
            const figures_altered_user_doesnt_have = await Figure.find({
                id_figure: { $not: { $in: alteredUser.unique_figs.map((fig) => fig.id_figure) } }
            });

            //find figures that user doesn't have
            const figures_user_doesnt_have = await Figure.find({
                id_figure: { $not: { $in: user.unique_figs.map((fig) => fig.id_figure) } }
            });

            // find matching figures in the two users
            let matching_figures_altered_user = [];
            let matching_figures_user = [];
            //find figures that alteredUser has and user doesn't have
            for (let j = 0; j < not_prom_figs_altered_user_filtered.length; j++) {
                const fig_altered_user = not_prom_figs_altered_user_filtered[j];
                for (let k = 0; k < figures_user_doesnt_have.length; k++) {
                    const fig_user = figures_user_doesnt_have[k];
                    if (fig_altered_user.id_figure == fig_user.id_figure) {
                        matching_figures_altered_user.push(fig_user);
                    }
                }
            }
            //find figures that user has and alteredUser doesn't have
            for (let j = 0; j < not_prom_figs_user_filtered.length; j++) {
                const fig_user = not_prom_figs_user_filtered[j];
                for (let k = 0; k < figures_altered_user_doesnt_have.length; k++) {
                    const fig_altered_user = figures_altered_user_doesnt_have[k];
                    if (fig_user.id_figure == fig_altered_user.id_figure) {
                        matching_figures_user.push(fig_altered_user);
                    }
                }
            }

            // if there are matching figures, create a match
            if (matching_figures_altered_user.length > 0 && matching_figures_user.length > 0) {
                // create match
                const id_match = uuidv4();
                const match = new Match({
                    id_match: id_match,
                    id_user_1: alteredUser.id_user,
                    id_user_2: user.id_user,
                    state: {
                        progress: 0,
                        description: "match created",
                        state_accepted: {
                            user_1: false,
                            user_2: false
                        },
                        state_notified: {
                            user_1: true,
                            user_2: true
                        }
                    },
                    figures: {
                        user_1: matching_figures_altered_user.map((fig) => { return { id_figure: fig.id_figure, _id_figure: fig._id } }),
                        user_2: matching_figures_user.map((fig) => { return { id_figure: fig.id_figure, _id_figure: fig._id } }),
                    },
                    timestamp_match: Math.floor(Date.now() / 1000),
                    distance: geolib.getDistance(
                        { latitude: alteredUser.last_login_position.lat, longitude: alteredUser.last_login_position.lng },
                        { latitude: user.last_login_position.lat, longitude: user.last_login_position.lng }
                    ),
                });
                await match.save();

               //console.log("Sugestão de match criada:");
               //console.log("User 1:", alteredUser.name, alteredUser.id_user);
               //console.log("Figures User 1:", matching_figures_altered_user.map((fig) => fig.id_figure));
               //console.log("User 2:", user.name, user.id_user);
               //console.log("Figures User 2:", matching_figures_user.map((fig) => fig.id_figure));


            }
        }
    }
   //console.log("verificaMatch end");
}

const userEventEmitter = User.watch()

//usar isso aqui pra dar trigger nos matches
userEventEmitter.on('change', change => {
   //console.log("Mudança no USER identificada!!!\n");
    //loop through all keys of the object
   //console.log(change);
    let shouldCall = false;
    if (change.operationType == "update") {
        for (let key in change.updateDescription.updatedFields) {
            if (key.split('.')[0] == "repeated_figs" || key.split('.')[0] == "last_login_position") {
                shouldCall = true;
            }
        }
    }
    if (shouldCall) {
        verificaMatch(change);
    }
});

async function setFiguresAsPromissed(user, match_figures_user) {
    for (let i = 0; i < match_figures_user.length; i++) {
        const fig_match = match_figures_user[i];
        // set the promissed to true to figure with id_figure == fig.id_figure
        user.repeated_figs = user.repeated_figs.map((fig) => {
            if (fig._id == fig_match._id_figure) {
                fig.is_promissed = true;
            }
            return fig;
        });
        await user.save();
    }
    return user;
}

async function setFiguresFreeFromPromisse(user, match_figures_user) {
    for (let i = 0; i < match_figures_user.length; i++) {
        const fig_match = match_figures_user[i];
        // set the promissed to false to figure with id_figure == fig.id_figure
        user.repeated_figs = user.repeated_figs.map((fig) => {
            if (fig._id == fig_match._id_figure) {
                fig.is_promissed = false;
            }
            return fig;
        });
        await user.save();
    }
    return user;
}
async function deleteMatch(id_match) {
    const match = await Match.findOne({ id_match: id_match });
    // let all figures in the match know that the match was deleted setting the promissed to false
    const id_user_1 = match.id_user_1;
    const id_user_2 = match.id_user_2;
    let user_1 = await User.findOne({ id_user: id_user_1 });
    let user_2 = await User.findOne({ id_user: id_user_2 });
    user_1 = await setFiguresFreeFromPromisse(user_1, match.figures.user_1);
    user_2 = await setFiguresFreeFromPromisse(user_2, match.figures.user_2);
    // delete the match entry in the database
    await Match.deleteOne({ id_match: id_match });

}
const match_stages = [
    {description: "match created", progress: 0},
    {description: "match accepted", progress: 1},
    {description: "match completed", progress: 2},
]
async function preceedMatch(match){

    match.state.progress = match.state.progress + 1;
    match.state.description = match_stages[match.state.progress].description;
    return match;
}
module.exports = {
    async acceptMatch(request, response) {
       //console.log("acceptMatch start");
        const { id_user, id_match, figures_accepted } = request.body;
        // select no match no banco
        // identifica se o user que enviou o websocket é o user_1 ou 2
        // coloca o accepted dele como true
        let match = await Match.findOne({ id_match: id_match });
        if (match) {
            if (match.id_user_1 == id_user) {
                //user 1 is accepting
                match.state.state_accepted.user_1 = true;
                if(match.state.progress == 0){
                    let figures_user_1 = match.figures.user_1.filter((fig) => figures_accepted.includes(fig.id_figure));
                    match.figures.user_1 = figures_user_1;
                }
            } else if (match.id_user_2 == id_user) {
                //user 2 is accepting
                match.state.state_accepted.user_2 = true;
                if(match.state.progress == 0){
                    let figures_user_2 = match.figures.user_1.filter((fig) => figures_accepted.includes(fig.id_figure));
                    match.figures.user_2 = figures_user_2;
                }
            }
            await match.save();

            // verifica se o accepted de ambos é true
            // se for true, avanca o state e envia um websocket para os 2 falando que o match progrediu
            // nota que um dos users pode estar deslogado, entao vc tem que salvar isso em algum lugar pra enviar um websocket quando ele logar.
            if (match.state.state_accepted.user_1 && match.state.state_accepted.user_2) {
                //match is accepted
                match = await preceedMatch(match);
                match.state.state_notified.user_1 = false;
                match.state.state_notified.user_2 = false;
                match.state.state_accepted.user_1 = false;
                match.state.state_accepted.user_2 = false;
                await match.save();
                if(match.state.progress == 1){
                    //set figures as promissed
                    user_1 = await User.findOne({ id_user: match.id_user_1 });
                    user_2 = await User.findOne({ id_user: match.id_user_2 });
                    if (user_1 && user_2) {
                        user_1 = await setFiguresAsPromissed(user_1, match.figures.user_1);
                        user_2 = await setFiguresAsPromissed(user_2, match.figures.user_2);
                        await user_1.save();
                        await user_2.save();
                    }
                }else if(match.state.progress == 2){
                    // faz a troca das figurinhas e tira as promessas delas
                }
                

            }
            return response.status(200).json({ message: "match accepted" });
        } else {
            return response.status(404).json({ error: 'Match não encontrado' });
        }
    },
    deleteMatch,
    async getMatchById(request, response) {
        const { id } = request.params;
        const match = await Match.findOne({ id_match: id });
        if (!match) {
            return response.status(404).json({ error: 'Match não encontrado' });
        }
        const user_1 = await User.findOne({ id_user: match.id_user_1 });
        const user_2 = await User.findOne({ id_user: match.id_user_2 });
        var data = {
            id_match: match.id_match,
            user_1: {
                id_user: user_1.id_user,
                name: user_1.name,
                photo: user_1.photo,
                contact_info: user_1.contact_info,
                figures: []
            },
            user_2: {
                id_user: user_2.id_user,
                name: user_2.name,
                photo: user_2.photo,
                contact_info: user_2.contact_info,
                figures: []
            },
            timestamp_match: match.timestamp_match,
            state: match.state
        }
        var figs1 = [];
        var figs2 = [];
        for (i in match.figures.user_1) {
            const fig = await Figure.findOne({ id_figure: match.figures.user_1[i].id_figure });
            const dt = { id_figure: fig.id_figure, photo_url: process.env.BASE_STATIC_FIG_URL + fig.photo_url };
            figs1.push(dt);
        }
        for (i in match.figures.user_2) {
            const fig = await Figure.findOne({ id_figure: match.figures.user_2[i].id_figure });
            const dt = { id_figure: fig.id_figure, photo_url: process.env.BASE_STATIC_FIG_URL + fig.photo_url };
            figs2.push(dt);
        }
        data.user_1.figures = figs1;
        data.user_2.figures = figs2;
        return response.status(200).json(data);
    },
    async getMatchByUserId(request, response) {
        const { id_user } = request.body;
        const user = await User.findOne({ id_user: id_user });
        if (!user) {
            return response.status(404).json({ error: 'Usuário não encontrado' });
        }
        const matches = await Match.find({ $or: [{ id_user_1: id_user }, { id_user_2: id_user }] });
        if (matches.length == 0) {
            return response.status(200).json({ error: 'Nenhum match encontrado para o usuário: ' + user.name });
        }
        var data = []
        for (i in matches) {
            var dt = {
                id_match: matches[i].id_match,
                user_1: {},
                user_2: {},
                timestamp_match: matches[i].timestamp_match,
                state: matches[i].state,
                figs_quantity: matches[i].figures.user_1.length
            }
            if (user.id_user == matches[i].id_user_1) {
                dt.user_1 = {
                    id_user: user.id_user,
                    name: user.name,
                    photo: user.photo,
                    contact_info: user.contact_info,
                }
                const user_2 = await User.findOne({ id_user: matches[i].id_user_2 });
                dt.user_2 = {
                    id_user: user_2.id_user,
                    name: user_2.name,
                    photo: user_2.photo,
                    contact_info: user_2.contact_info,
                }
            } else {
                dt.user_2 = {
                    id_user: user.id_user,
                    name: user.name,
                    photo: user.photo,
                    contact_info: user.contact_info,
                }
                const user_1 = await User.findOne({ id_user: matches[i].id_user_1 });
                dt.user_1 = {
                    id_user: user_1.id_user,
                    name: user_1.name,
                    photo: user_1.photo,
                    contact_info: user_1.contact_info,
                }
            }
            data.push(dt);
        }
        return response.status(200).json(data);
    }
}