import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { InterfaceWHLBot } from ".";
import { getDb } from "./firestore_config";

const handler = async (interaction: CommandInteraction) => {
    const subCommand = interaction.options.getSubcommand();
    if (subCommand === "new") roomCreateHandler(interaction);
    else roomDeleteHandler(interaction);
}

const roomCreateHandler = async (interaction: CommandInteraction) => {
    await interaction.reply("new");
}

const roomDeleteHandler = async (interaction: CommandInteraction) => {
    await interaction.reply("close");
}

const setup = (client: InterfaceWHLBot) => {
    client.addCommand(
        handler,
        new SlashCommandBuilder()
            .setName("room")
            .setDescription("試合部屋を管理するコマンド")
            .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName("new")
                .setDescription("新しい部屋を作成します。")
            )
            .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName("close")
                .setDescription("あなたの作った部屋をアーカイブします。")
            )
    );
}

export default setup;