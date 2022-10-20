const express = require("express");
const routes = express.Router();

const FiguraController = require("./controllers/FiguraController");
const UserController = require("./controllers/UserController");




// Rotas de Usuário	
routes.post('/user/signup', UserController.signup);
routes.post("/user/figurinha", FiguraController.getFigurasByUserId);

// Rotas de Figuras
routes.get("/figurinha", FiguraController.getFiguras);
routes.get("/figurinha/:id", FiguraController.getFigById);



module.exports = routes;