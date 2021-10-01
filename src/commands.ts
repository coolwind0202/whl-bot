import { Client, CommandInteraction } from "discord.js"
import { SlashCommandBuilder } from "@discordjs/builders"

const command = (builder: SlashCommandBuilder): any => 
    (target: { (interaction: CommandInteraction): void }, _:any, descriptor: TypedPropertyDescriptor<any>) => {
        client.on("interactionCreate", async interaction => {
            descriptor.
            if (!interaction.isCommand()) return;

            if (interaction.commandName === builder.name) {
                target(interaction);
            }
        })
    }

export {
    command
}