const mongoose = require('mongoose');

//const PositionSchema = new mongoose.Schema();
const UserSchema = new mongoose.Schema({
    id_user:{
        type: Number,
        required: true,
    },
    name:{
        type: String,
        required: true,
    },
    photo:{
        type: String,
        required: true,
    },
    last_login_position: {
        lat:{type: Number,required:true},
        lng:{type: Number,required:true},
        timestamp:{type: Number,required:true} 
        

    },
    unique_figs: [{
        type: Number,
        required: true,
    }],
    repeated_figs: [{
        type: Number,
        required: true,
    }],
    //wanted_figs -> vai ser o conjunto inverso do unique_figs
    contact_info: {
        contact_type: {type: String,required:true},
        contact_value: {type: String,required:true}
    },
    salt_psw: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },

});

const User = mongoose.model('User', UserSchema);
module.exports = User;

