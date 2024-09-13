import { randomUUID, UUID } from "crypto";
import { Server } from "socket.io";

type GameState = {[gid: UUID] : {
  players: {[uid: UUID] : {
    name?: string,
    connected: boolean,
    admin: boolean
  }},
  game: {
    state: "lobby" | "game"
    mode: "default"
  }
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
    let firstJoin = true;

    // Add game to state
    this.#state[gid] = {
      players: {},
      game: {
        state: "lobby",
        mode: "default"
      }
    }

    // Create new namespace for game sockets
    const nsp = this.#io.of("/" + gid)

    // Register connect event
    nsp.on("connection", (socket) => {

      // Register join event, only callable once per connection attempt
      socket.once("join", (data: { uid?: UUID, name?: string }, res) => {

        const uid = data.uid || randomUUID()

        // Add/Set player status - if first join set admin
        this.#state[gid].players[uid] = {
          name: data.name,
          connected: true,
          admin: firstJoin
        }

        // Add socket to its own room (for individual communication)
        socket.join(uid)

        // Register disconnect event
        socket.on("disconnect", () => {
        
          // Set connection status of player, if exist
          if (this.#state[gid].players[uid] !== undefined)
            this.#state[gid].players[uid].connected = false

          // If admin disconnects close game
          if (this.#state[gid].players[uid].admin) {
            nsp.disconnectSockets()
            delete this.#state[gid]
          }

        })

        // Register leave event
        socket.on("leave", () => {

          // Remove player 
          delete this.#state[gid].players[uid]

          // Disconnect socket
          socket.disconnect(true)

        })

        // if admin, register change game mode event
        if (firstJoin) {
          socket.on("change_mode", (newMode) => {
            //TODO: CHeck if newMode is valid
            this.#state[gid].game.mode = newMode
            nsp.emit("state_changed", this.#state[gid])
          })
        }

        // if admin, register start game event
        if (firstJoin) {
          socket.on("start_game", () => {
            this.#state[gid].game.state = "game"
            nsp.emit("state_changed", this.#state[gid])
          })
        }

        // Return info
        res({ uid: uid, admin: firstJoin })

        firstJoin = false;

      })

    })

    return gid

  }

}