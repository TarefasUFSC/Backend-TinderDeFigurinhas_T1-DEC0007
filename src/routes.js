const express = require("express");
const routes = express.Router();

const FiguraController = require("./controllers/FiguraController");
const UserController = require("./controllers/UserController");
const MatchController = require("./controllers/MatchController");




// Rotas de Usuário	
routes.post('/user/signup', UserController.signup);
routes.post("/user/figurinha", FiguraController.getFigurasByUserId);
routes.post("/user/match", MatchController.getMatchByUserId);


// Rotas de Figuras
routes.get("/figurinha", FiguraController.getFiguras);
routes.get("/figurinha/:id", FiguraController.getFigById);

// Rotas de Match
routes.get("/match/:id", MatchController.getMatchById);


module.exports = routes;