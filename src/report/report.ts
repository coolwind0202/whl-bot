import { InterfaceWHLBot } from "..";
import { BaseGuildTextChannel, ContextMenuInteraction, MessageEmbed, TextBasedChannels, ThreadChannel, TextChannel } from "discord.js";
import { log } from "../utils/log";

const handler = async (interaction: ContextMenuInteraction, client: InterfaceWHLBot) => {
    const channel = interaction.channel;
    if (channel === null) return;

    const isGuildChannel = (c: TextBasedChannels): c is (TextChannel | ThreadChannel) => {
        return c.type !== "DM" && c.type !== "GUILD_NEWS";
    }

    if (!isGuildChannel(channel)) return;

    const message = await channel.messages.fetch(interaction.targetId);
    const embed = new MessageEmbed()
        .setTitle(`${channel.name} で通報がありました`)
        .addField("通報者", interaction.member?.toString() ?? "不明")
        .addField("メッセージの投稿者", message.author.toString())
        .addField("メッセージ内容", message.content || "なし")
        .setURL(message.url)
        .setTimestamp(Date.now())
        .setColor("RED")

    log(embed);
    
    await interaction.reply({
        content: "ご協力ありがとうございます。いただいた通報をもとに問題を確認した上で、対処させていただきます。",
        ephemeral: true
    });
}

const setup = (client: InterfaceWHLBot) => {

    client.on("interactionCreate", async interaction => {
        if (!interaction.inGuild()) return;
        if (!interaction.isContextMenu()) return;

        if (interaction.commandName === "通報") {
            await handler(interaction, client);
        }
    });
}

export default setup;