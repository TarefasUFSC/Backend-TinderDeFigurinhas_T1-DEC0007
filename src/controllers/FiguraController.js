const User = require('../db/models/user');
const Figure = require('../db/models/figure');

module.exports = {
    async getFigById(request, response) {
        const { id } = request.params;
        const fig = await Figure.findOne({id_figure: id});

        if(!fig){
            return response.status(400).json({error: "Figurinha não encontrada"});
        }

        data = {
            id: id,
            photo_url: "http://localhost:3333/"+fig.photo_url
        }
    return response.json(data);
    },

    async getFigurasByUserId(request, response) {
        const { id_user } = request.body;
        const user = await User.findOne({ id_user: id_user });

        if(!user){
            return response.status(400).json({ error: 'Usuário não encontrado' });
        }
        unique_data = [];
        repeated_data = [];
        //console.log(user);
        for ( i in user.unique_figs) {
            const fig = await Figure.findOne({id_figure: user.unique_figs[i].id_figure});
            //console.log(fig);
            unique_data.push({ id_figure: user.unique_figs[i].id_figure, photo_url: "http://localhost:3333/"+fig.photo_url });
        }
        for ( i in user.repeated_figs) {
            //console.log("b");
            //console.log(user.repeated_figs[i]);
            const fig = await Figure.findOne({id_figure: user.repeated_figs[i].id_figure});
            repeated_data.push({ id_figure: user.repeated_figs[i].id_figure, photo_url: "http://localhost:3333/"+fig.photo_url, is_promissed: user.repeated_figs[i].is_promissed });
        }

        return response.status(200).json({unique_figs: unique_data, repeated_figs: repeated_data});
    },

    async getFiguras(request, response) {
        const figs = await Figure.find({},"id_figure photo_url");
        if(!figs){
            return response.status(400).json({ error: 'Figurinhas não encontradas' });
        }
        data = [];
        for(i in figs){
            dt = {
                id_figure: figs[i].id_figure,
                photo_url: "http://localhost:3333/"+ figs[i].photo_url
            };
            data.push(dt);
        }
        return response.status(200).json({figure_list: data});
    }
};