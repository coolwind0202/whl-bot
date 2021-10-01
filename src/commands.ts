import { Client, CommandInteraction } from "discord.js"
import { SlashCommandBuilder } from "@discordjs/builders"


const addCommand = (client: Client, func: { (interaction: CommandInteraction): void }, builder: SlashCommandBuilder) => {
    client.on("interactionCreate", async interaction => {
        if (!interaction.isCommand()) return;

        if (interaction.commandName === builder.name) {
            func(interaction);
        }
    })
}
export {
    addCommand
}