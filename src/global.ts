import { UUID } from "crypto"

type State = {[gid: UUID] : {
  players: {[uid: UUID] : {
    connected: boolean,
    name: string,
  }},
  game: {
    state: "lobby" | "playing"
  }
}}


export const state: State = {}