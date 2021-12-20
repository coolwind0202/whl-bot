import { ApplicationCommandType } from "discord-api-types";

type CommandJsonType = { 
    name: string,
    type: ApplicationCommandType,
    description: string
}


export type { CommandJsonType }