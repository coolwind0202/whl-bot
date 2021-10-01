import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { InterfaceWHLBot } from ".";

const handler = async (interaction: CommandInteraction) => {
    await interaction.reply("hello!");
}

const setup = (client: InterfaceWHLBot) => {
    client.addCommand(
        handler,
        new SlashCommandBuilder()
            .setName("hello")
            .setDescription("send hello")
    );
}

export default setup;