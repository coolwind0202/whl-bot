import { ApplicationCommandType } from "discord-api-types";
import { CommandJsonType } from "./schema";

const json: CommandJsonType = {
    name: "プロフィール",
    type: ApplicationCommandType.User,
    description: ""
}

export default json;