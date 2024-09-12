import { createServer } from "http";
import express from "express"
import { Server } from "socket.io";

import "dotenv/config"
import { GameManager } from "./mgn";
import { UUID } from "crypto";

// Init express instance
const api = express()

// Create http server
const server = createServer(api)

// Init websocket instance
const io = new Server(server, {})

// Init GameManager
const gm = new GameManager(io)

// Register API Events

// GET Request for checking if Game for GID exists
api.get("/game", (req, res) => {

  const gid = req.query.gid as UUID;

  if (!gid) res.status(402).send("GID is not specified");

  else if (!gm.doesGameExist(gid)) res.status(404).send("Game does not exist");

  res.status(200).send(gid);

})

// GET reqeust for api info
api.get("/", (_, res) => {
  res.send("OK")
})

// POST request for creating a new game
api.post("/game", (_, res) => {

  const gid = gm.createNewGame();

  res.status(200).send(gid)

})

// Start http server
const port = process.env.LISTING_PORT || 3000

server.listen(port, () => {
  console.log("[Server] started listening...")
})