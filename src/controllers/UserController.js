

const mongoose = require('mongoose');
const User = require('../db/models/user');
const Figure = require('../db/models/figure');
const Match = require('../db/models/match');
const saltedMd5 = require('salted-md5');
const deleteMatch = require('./MatchController').deleteMatch;

const { v4: uuidv4 } = require('uuid');


async function checkIfFigureHasACopy(figureId, id_user) {
    const fig_in_user = await User.findOne(
        {
            id_user: id_user,
            repeated_figs: {
                $elemMatch: {
                    id_figure: figureId
                }
            }
        });
    if (fig_in_user) {
        return true;
    }
    return false;

}


async function deleteRepeatedFigure(id_figure, id_user) {
    //------------------
    // remotion of repeated figure
    // check if the there is at least one copy of this figure in repeated_figs that is not promissed
    // if there is, remove it from repeated_figs
    // if not, delete the match that this figure and then remove it from repeated_figs
    //------------------
    // delete match
    // let all figures in the match know that the match was deleted setting the promissed to false
    // delete the match entry in the database

    const user = await User.findOne({ id_user: id_user });

    // check if the there is at least one copy of this figure in repeated_figs that is not promissed
    const not_promissed_figs = user.repeated_figs.filter((fig) => fig.id_figure == id_figure && fig.is_promissed == false);
    if (not_promissed_figs.length > 0) {
        // if there is, remove it from repeated_figs
        const delete_prom_id = not_promissed_figs[0]._id;
        user.repeated_figs = user.repeated_figs.filter((fig) => fig._id != delete_prom_id);
        await user.save(); // isso aqui funciona????????????????????
    }
    else {
        // if not, delete the match that this figure and then remove it from repeated_figs
        const match = await Match.findOne({
            $or: [
                {
                    id_user_1: id_user,
                    figures: {
                        $elemMatch: {
                            id_figure: id_figure
                        }
                    }
                },
                {
                    id_user_2: id_user,
                    figures: {
                        $elemMatch: {
                            id_figure: id_figure
                        }
                    }
                }
            ]
        });
        if (match) {
            await deleteMatch(match.id_match);
        }

    }

}

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
        const id_user = await uuidv4();
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
        if (!new_figures && !remotions) {
            return response.status(401).json({ error: "You need to add or remove figures" });
        }
        console.log("d");



        // ADICIONAR FIGURAS ESTÁ BUGADO E PRECISA ARRUMAR
        // ADICIONA DUAS FIGURINHAS IGUAS COMO UNICAS
        if (new_figures) {
            // add new figures
            console.log("adding new figs");
            const user = await User.findOne({ id_user: id_user });
            for (let i = 0; i < new_figures.length; i++) {

                const fig = await Figure.findOne({ id_figure: new_figures[i] });
                if (!fig) {
                    return response.status(401).json({ error: "Figure not found" });
                }

                // check if the figure is already in the user's album
                const fig_in_album = user.unique_figs.filter((fig) => fig.id_figure == new_figures[i]);
                if (fig_in_album.length > 0) {
                    // if it is, add it to repeated_figs
                    const repeated_fig = {
                        id_figure: new_figures[i],
                        is_promissed: false
                    }
                    user.repeated_figs.push(repeated_fig);
                }
                else {
                    // if not, add it to unique_figs
                    const unique_fig = {
                        id_figure: new_figures[i],
                        is_promissed: false
                    }
                    user.unique_figs.push(unique_fig);
                }


                // const fig_in_user = await User.findOne(
                //     {
                //         id_user: id_user,
                //         unique_figs: {
                //             $elemMatch: {
                //                 id_figure: new_figures[i]
                //             }
                //         }
                //     });
                // if (fig_in_user) {
                //     // figure already in user
                //     user.repeated_figs.push({
                //         id_figure: new_figures[i],
                //         is_promissed: false
                //     });
                    
                // } else {
                //     user.unique_figs.push({
                //         id_figure: new_figures[i]
                //     });
                    
                // }
            }
            await user.save();

            return response.status(200).json({ message: "Figures added to user" });


        }
        console.log(remotions);
        if (remotions.rem_unique) {
            // remove figures
            // remotions = {unique_figs, repeated_figs}
            const { rem_unique } = remotions;




            // check if there is a copy of that unique figure in repeated_figs

            // if theres a copy, remove it from repeated_figs
            // if not, remove it from unique_figs

            //------------------
            // remotion of repeated figure
            // check if the there is at least one copy of this figure in repeated_figs that is not promissed
            // if there is, remove it from repeated_figs
            // if not, delete the match that this figure and then remove it from repeated_figs
            //------------------
            // delete match
            // let all figures in the match know that the match was deleted setting the promissed to false
            // delete the match entry in the database


            //removes from uniques and take one from repeated if exists and put in uniques, deleting every match that is found with that specific repeated
            for (let i = 0; i < rem_unique.length; i++) {
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
                const has_copy = await checkIfFigureHasACopy(rem_unique[i], id_user);
                if (has_copy) {
                    deleteRepeatedFigure(rem_unique[i], id_user);

                } else {
                    // there is no copy of this figure in repeated_figs than shall be deleted from unique
                    user.unique_figs = user.unique_figs.filter(function (obj) {
                        return obj.id_figure != rem_unique[i];
                    });
                    await user.save()
                    
                }

            }

        }
        if (remotions.rem_repeated) {
            // remove figures
            // remotions = {unique_figs, repeated_figs}
            const { rem_repeated } = remotions;
            console.log("removing repeated");
            for (let i = 0; i < rem_repeated.length; i++) {
                deleteRepeatedFigure(rem_repeated[i], id_user);
            }
        }
        return response.status(200).json({ message: "Operation succeeded" });
    },
};