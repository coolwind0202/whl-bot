import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { InterfaceWHLBot } from ".";

const handler = async (interaction: CommandInteraction) => {
    await interaction.reply("pong");
}

const setup = (client: InterfaceWHLBot) => {
    client.addCommand(
        handler,
        new SlashCommandBuilder()
            .setName("ping")
            .setDescription("ping-pong コマンド（動作確認用）")
    );
}

export default setup;