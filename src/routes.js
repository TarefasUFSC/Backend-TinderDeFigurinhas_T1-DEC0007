const express = require("express");
const routes = express.Router();


const FiguraController = require("./controllers/FiguraController");

routes.get("/figura/:id", FiguraController.getFigById);

module.exports = routes;