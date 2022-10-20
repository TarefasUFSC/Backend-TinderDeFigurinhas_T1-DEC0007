const express = require("express");
const routes = express.Router();

const FiguraController = require("./controllers/FiguraController");

routes.get("/figurinha/:id", FiguraController.getFigById);

routes.post("/user/figurinha", FiguraController.getFigurasByUserId);

routes.get("/figurinha", FiguraController.getFiguras);

module.exports = routes;