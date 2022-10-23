const mongoose = require('mongoose');


const MatchScheme = new mongoose.Schema({
    id_match:{
        type: Number,
        required: true,
        unique: true
    },
    id_user_1:{
        type: Number,
        required: true,
    },
    id_user_2:{
        type: Number,
        required: true,
    },
    state:{
        progress: {type: Number,required:true},
        description: {type: String,required:false},
    },
    figures: {
        user_1:[{id_figure:{type: Number,required:true},_id_figure:{type: String,required:true}}],
        user_2:[{id_figure:{type: Number,required:true},_id_figure:{type: String,required:true}}],
    },
    timestamp_match: {type:Number,required:true},
});
const Match = mongoose.model('matches', MatchScheme);
module.exports = Match;