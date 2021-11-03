import { MessageEmbed } from "discord.js";
import axios from "axios";

const log = (embed: MessageEmbed) => {
    if (!process.env.LOG_WEBHOOK) return;
    axios.post(process.env.LOG_WEBHOOK, {
        "embed": embed.toJSON()
    });
}

export { log }