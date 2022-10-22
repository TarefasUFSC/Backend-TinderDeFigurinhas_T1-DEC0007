

const mongoose = require('mongoose');
const User = require('../db/models/user');
const Figure = require('../db/models/figure');
const saltedMd5 = require('salted-md5');

module.exports = {
    async login(data){
        //console.log(data);
        const {email, password} = data;
        const user = await User.findOne({email: email});
        
        if(!user){
            return {error: "User not found"};
        }
        
        const salt_psw = saltedMd5(password, process.env.SALT);
        if(salt_psw == user.salt_psw){
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
        return {error: "Wrong password"};
    },
    async signup(request, response) {
        //console.log(request.body.name);
        const { name, email, password, contact_type, contact_value, photo, last_login_position } = request.body;
        //const saltedHash = saltedMd5('Some data.', 'SUPER-S@LT!');
        const salt_psw = saltedMd5(password, process.env.SALT);
        const id_user = await User.countDocuments();
        const now_timestamp = Date.now();

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
    }
};