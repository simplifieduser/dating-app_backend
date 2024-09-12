import { randomUUID, UUID } from "crypto";
import { Server } from "socket.io";

type GameState = {[gid: UUID] : {
  players: {[uid: UUID] : {
    name?: string,
    connected: boolean 
  }},
  game: {}
}}


export class GameManager {

  #io: Server;
  #state: GameState;

  constructor(io: Server) {
    this.#io = io;
    this.#state = {};
  }

  doesGameExist(gid: UUID): boolean {

    return this.#state[gid] !== undefined

  }

  createNewGame(): UUID {

    const gid = randomUUID();

    // Add game to state
    this.#state[gid] = {
      players: {},
      game: {}
    }

    // Create new namespace for game sockets
    const nsp = this.#io.of("/" + gid)

    // Register connect event
    nsp.on("connection", (socket) => {

      // Register join event
      socket.on("join", (data: { uid?: UUID, name?: string }, res) => {

        const uid = data.uid || randomUUID()

        // Add/Set player status
        this.#state[gid].players[uid] = {
          name: data.name,
          connected: true
        }

        // Add socket to its own room (for individual communcication)
        socket.join(uid)

        // Register disconnect event
        socket.on("disconnect", () => {
        
          // Set connection status of player, if exist
          if (this.#state[gid].players[uid] !== undefined)
            this.#state[gid].players[uid].connected = false

        })

        // Register leave event
        socket.on("leave", () => {

          // Remove player 
          delete this.#state[gid].players[uid]

          // Disconnect socket
          socket.disconnect(true)

        })

        // Acknoledge uid
        res({ uid: uid })

      })

    })

    // Register auto-close event
    setInterval(() => {
      
    }, 3600)

    return gid

  }

}