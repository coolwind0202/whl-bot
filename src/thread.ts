import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, CommandInteraction } from "discord.js";
import { command } from "./commands";

interface Cog {
    client: Client
}

class ThreadCog implements Cog {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }
}

const setup = (client: Client) => {
    
}



export default setup;