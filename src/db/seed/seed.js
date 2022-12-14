require('dotenv').config();
const mongoose = require('mongoose');
const Figure = require('../models/figure.js');
const fs=require('fs');

function getFiles (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}
mongoose.connect("mongodb+srv://gourmet:"+process.env.MONGODB_PSW+"@clusterdec0007.itfze4v.mongodb.net/DEC0007_T1?retryWrites=true&w=majority")
const database = mongoose.connection;
database.on('error',(e)=>{console.log(e);})
database.once('connected',async ()=>{
    console.log("Db conectado");
    

    await database.db.dropCollection("figuras", function(err, result) {
        if(err){console.log("Erro ao deletar figuras");}
        console.log("Collection figuras droped");
    });
    await Figure.createCollection().then(function (collection) {
        console.log('Collection figuras is created!');
    });
    await populateFigure();
    process.exit()
})
async function  populateFigure(){
    console.log("Populating figuras");
    // Walker options
    var files = getFiles('public/figurinhas_da_copa_2022');
    for (file in files){
        console.log("File: "+files[file]);
        //console.log(files[file]);
        //console.log();
        try{
            console.log(files[file].split("/")[2].split(".")[0]);
            const dt_fig = {
                id_figure: parseInt(files[file].split("/")[2].split(".")[0]),
                photo_url: files[file]
            }
            const fig = await Figure.create(dt_fig);
        }catch(e){
            console.log(e);
        }
    }
    console.log("Done");
    
    return
}
