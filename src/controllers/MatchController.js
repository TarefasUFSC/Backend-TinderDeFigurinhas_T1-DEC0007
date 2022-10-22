const User = require('../db/models/user');
const Figure = require('../db/models/figure');
const Match = require('../db/models/match');

module.exports = {
    async getMatchById(request, response) {
        const { id } = request.params;
        const match = await Match.findOne({id_match: id});
        if(!match){
            return response.status(404).json({ error: 'Match não encontrado' });
        }
        const user_1 = await User.findOne({id_user: match.id_user_1});
        const user_2 = await User.findOne({id_user: match.id_user_2});
        var data = {
            id_match: match.id_match,
            user_1: {
                id_user: user_1.id_user,
                name: user_1.name,
                photo: user_1.photo,
                contact_info: user_1.contact_info,
                figures:[]
            },
            user_2: {
                id_user: user_2.id_user,
                name: user_2.name,
                photo: user_2.photo,
                contact_info: user_2.contact_info,
                figures:[]
            },
            timestamp_match: match.timestamp_match,
            state: match.state
        }
        var figs1 = [];
        var figs2 = [];
        for(i in match.figures.user_1){
            const fig = await Figure.findOne({id_figure: match.figures.user_1[i].id_figure});
            const dt =  {id_figure: fig.id_figure, photo_url: process.env.BASE_STATIC_FIG_URL +  fig.photo_url};
            figs1.push(dt);
        }
        for(i in match.figures.user_2){
            const fig = await Figure.findOne({id_figure: match.figures.user_2[i].id_figure});
            const dt = {id_figure: fig.id_figure, photo_url: process.env.BASE_STATIC_FIG_URL +  fig.photo_url};
            figs2.push(dt);
        }
        data.user_1.figures = figs1;
        data.user_2.figures = figs2;
        return response.status(200).json(data);
    },
    async getMatchByUserId(request, response) {
        const {id_user} = request.body;
        const user = await User.findOne({id_user: id_user});
        if(!user){
            return response.status(404).json({ error: 'Usuário não encontrado' });
        }
        const matches = await Match.find({$or: [{id_user_1: id_user}, {id_user_2: id_user}]});
        if(matches.length == 0){
            return response.status(404).json({ error: 'Nenhum match encontrado para o usuário: '+ user.name });
        }
        var data = []
        for(i in matches){
            var dt = {
                id_match: matches[i].id_match,
                user_1: {},
                user_2: {},
                timestamp_match: matches[i].timestamp_match,
                state: matches[i].state,
                figs_quantity: matches[i].figures.user_1.length
            }
            if(user.id_user == matches[i].id_user_1){
                dt.user_1 = {
                    id_user: user.id_user,
                    name: user.name,
                    photo: user.photo,
                    contact_info: user.contact_info,
                }
                const user_2 = await User.findOne({id_user: matches[i].id_user_2});
                dt.user_2 = {
                    id_user: user_2.id_user,
                    name: user_2.name,
                    photo: user_2.photo,
                    contact_info: user_2.contact_info,
                }
            }else{
                dt.user_2 = {
                    id_user: user.id_user,
                    name: user.name,
                    photo: user.photo,
                    contact_info: user.contact_info,
                }
                const user_1 = await User.findOne({id_user: matches[i].id_user_1});
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