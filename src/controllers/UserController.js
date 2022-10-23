

const mongoose = require('mongoose');
const User = require('../db/models/user');
const Figure = require('../db/models/figure');
const Match = require('../db/models/match');
const saltedMd5 = require('salted-md5');

module.exports = {
    async login(data) {
        //console.log(data);
        const { email, password, last_login_position } = data;

        const user = await User.findOne({ email: email });

        if (!user) {
            return { error: "User not found" };
        }
        // update last login position
        const nuser = await User.findOneAndUpdate({ email: email }, {
            last_login_position: {
                lat: last_login_position.lat,
                lng: last_login_position.lng,
                timestamp: Math.floor(Date.now() / 1000)
            }
        }, { new: true });
        const salt_psw = saltedMd5(password, process.env.SALT);
        if (salt_psw == user.salt_psw) {
            console.log(user);
            const dt = {
                id_user: user.id_user,
                name: user.name,
                photo: user.photo,
                unique_figs: user.unique_figs,
                repeated_figs: user.repeated_figs,
            }
            return dt;
        }
        return { error: "Wrong password" };
    },
    async signup(request, response) {
        const { name, email, password, contact_type, contact_value, photo, last_login_position } = request.body;
        //const saltedHash = saltedMd5('Some data.', 'SUPER-S@LT!');
        const salt_psw = saltedMd5(password, process.env.SALT);
        const id_user = await User.countDocuments();
        const now_timestamp = Math.floor(Date.now() / 1000);

        // check if user already exists
        const user = await User.findOne({ email });
        if (user) {
            return response.status(401).json({ error: 'User already exists' });
        }
        const dt_user = {
            id_user: id_user,
            name: name,
            photo: photo,
            last_login_position: {
                lat: last_login_position.lat,
                lng: last_login_position.lng,
                timestamp: now_timestamp
            },
            unique_figs: [],
            repeated_figs: [],
            contact_info: {
                contact_type: contact_type,
                contact_value: contact_value
            },
            salt_psw: salt_psw,
            email: email
        }
        try {
            const user = await User.create(dt_user);
            return response.status(200).json({
                id_user: user.id_user,
                name: user.name,
                photo: user.photo,
                unique_figs: user.unique_figs,
                repeated_figs: user.repeated_figs,
            });
        } catch (e) {
            return response.status(500).json(e);
        }
    },
    async updateAlbumByUserId(request, response) {
        const { id_user, new_figures, remotions } = request.body;
        const user = await User.findOne({ id_user: id_user });
        console.log("a");
        if (!user) {
            return response.status(401).json({ error: "User not found" });
        }
        console.log("b");
        if (new_figures && remotions) {
            return response.status(401).json({ error: "You can't add and remove figures at the same time" });
        }
        console.log("c");
        if(!new_figures && !remotions){
            return response.status(401).json({ error: "You need to add or remove figures" });
        }
        console.log("d");
        if (new_figures) {
            // add new figures
            console.log("adding new figs");
            for (let i = 0; i < new_figures.length; i++) {
                const fig = await Figure.findOne({ id_figure: new_figures[i] });
                if (!fig) {
                    return response.status(401).json({ error: "Figure not found" });
                }
                const fig_in_user = await User.findOne(
                    { 
                        id_user: id_user, 
                        unique_figs: { 
                            $elemMatch: { 
                                id_figure: new_figures[i] 
                            } 
                        }
                    });
                if (fig_in_user) {
                    // figure already in user
                    const user = await User.findOneAndUpdate(
                        { id_user: id_user }, 
                        { $push: { 
                            repeated_figs: { 
                                id_figure: new_figures[i], 
                                is_promissed: false 
                                } 
                            } 
                        });
                } else {
                    const user = await User.findOneAndUpdate(
                        {id_user: id_user}, 
                        { 
                            $push: { 
                                unique_figs: { 
                                    id_figure: new_figures[i] 
                                } 
                            } 
                        });
                }     
                return response.status(200).json({ message: "Figures added to user" });       
        }
        

    }
    console.log(remotions);
        if(remotions.rem_unique){ 
            // remove figures
            // remotions = {unique_figs, repeated_figs}
            const {rem_unique} = remotions;
            if(rem_unique.length > 0){
                //removes from uniques and take one from repeated if exists and put in uniques, deleting every match that is found with that specific repeated
                for (let i = 0; i < rem_unique.length; i++) {
                    const fig = await Figure.findOne({ id_figure: rem_unique[i] });
                    if (!fig) {
                        return response.status(401).json({ error: "Figure not found" });
                    }
                    const fig_in_user = await User.findOne(
                        { 
                            id_user: id_user, 
                            unique_figs: { 
                                $elemMatch: { 
                                    id_figure: rem_unique[i] 
                                } 
                            }
                        });
                    if (!fig_in_user) {
                        // figure not in user
                        return response.status(401).json({ error: "Figure not in user" });
                    }
                    const repeated_fig = await User.findOne(
                        { 
                            id_user: id_user, 
                            repeated_figs: { 
                                $elemMatch: { 
                                    id_figure: rem_unique[i]
                                } 
                            }
                        });
                        if(!repeated_fig){
                            // no repeated figs
                            return response.status(404).json({ error: "No repeated figures with id " + rem_unique[i] });
                        }
                        //console.log(repeated_fig.repeated_figs);
                        //find every repeated fig with id_figure
                        const figs = repeated_fig.repeated_figs.filter(fig => fig.id_figure == rem_unique[i]);
                        console.log(figs);
                        const prom_figs = figs.filter(fig => fig.is_promissed == true);
                        console.log(prom_figs);
                        if(figs.length>prom_figs.length){
                            // remove repeated and add to uniques
                            const user = await User.findOneAndUpdate(
                                { id_user: id_user }, 
                                { $pull: { 
                                    repeated_figs: { 
                                        id_figure: rem_unique[i],
                                        is_promissed: false 
                                    } 
                                } 
                            });
                        }
                        else{
                            if(prom_figs.length>0){
                                console.log("promissed");
                                // remove repeated and add to uniques
                                const user = await User.findOneAndUpdate(
                                    { id_user: id_user }, 
                                    { $pull: { 
                                        repeated_figs: { 
                                            id_figure: rem_unique[i],
                                            is_promissed: true 
                                        } 
                                    } 
                                });
                                //get all match of this user
                                const match = await Match.find({
                                    $or: [
                                        { id_user1: id_user },
                                        { id_user2: id_user }
                                    ]
                                });
                                console.log(match);
                                console.log( match.length);
                                for(let j = 0; j < match.length; j++){
                                    if(match[j].id_user_1 == id_user){
                                        //remove from user1
                                        console.log(match[j].figures.user_1.length);
                                        for(let k = 0;k<match[j].figures.user_1.length;k++){
                                            console.log(match[j].figures.user_1[k].id_figure == rem_unique[i]);
                                            if(match[j].figures.user_1[k].id_figure == rem_unique[i]){
                                                await Match.deleteOne({  id_match: match[j].id_match  });
                                                
                                                console.log("removed from user 1");
                                            }
                                        }
                                    }
                                    else{
                                        for(let k = 0;k<match[j].user2_figs.length;k++){
                                            if(match[j].user1_figs[k].id_figure == rem_unique[i]){
                                                await Match.deleteOne({ id_match: match[j].id_match  });
                                                
                                            }
                                        }
                                    }
                                }

                                
                            }
                            else{
                                return response.status(404).json({ error: "Figure not in user" });
                            }
                        }
                    /*
                    if (repeated_fig) {
                        
                    }else{
                        // remove unique
                        const user = await User.findOneAndUpdate(
                            { id_user: id_user }, 
                            { $pull: { 
                                unique_figs: { 
                                    id_figure: rem_unique[i] 
                                } 
                            } 
                        });
                    } */
                }
            }
        }
        return response.status(200).json({ message: "Operation succeeded" });
},
};