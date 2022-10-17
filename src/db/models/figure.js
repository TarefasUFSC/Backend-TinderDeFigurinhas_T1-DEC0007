const mongoose = require('mongoose');


const FigureSchema = new mongoose.Schema({
    id_figure:{
        type: Number,
        required: true,
        unique: true 
    },
    photo_url:{
        type: String,
        required: true,
    },
});
const Figure = mongoose.model('figuras', FigureSchema);
module.exports = Figure;