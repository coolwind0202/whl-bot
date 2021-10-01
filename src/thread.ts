import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, CommandInteraction } from "discord.js";
import { addCommand } from "./commands";

const handler = async (interaction: CommandInteraction) => {
    await interaction.reply("hello!");
}

const setup = (client: Client) => {
    addCommand(
        client,
        handler,
        new SlashCommandBuilder()
            .setName("hello")
    )
}



export default setup;