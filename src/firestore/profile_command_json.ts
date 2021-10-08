import { ApplicationCommandType } from "discord-api-types";

type CommandJsonType = { 
    name: string,
    type: ApplicationCommandType,
    description: string
}

const json: CommandJsonType = {
    name: "プロフィール",
    type: ApplicationCommandType.User,
    description: ""
}

export default json;