import { CommandInteraction, ContextMenuInteraction, EmbedFieldData, Message, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { InterfaceWHLBot } from "..";
import { getDb } from "./firestore_config";

const tagFields = async (tags: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>): Promise<EmbedFieldData[]> => {
    const fields: EmbedFieldData[] = [];
    for (const tag of tags.docs) {
        const parent = tag.data();
        const contentRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData> = parent.content;
        const snapShot = await contentRef.get();
        const data = snapShot.data();
        if (data) fields.push({ name: data.title, value: data.description, inline: true });
    }
    return fields;
}

const embed = async (data: FirebaseFirestore.DocumentData | undefined, tags: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>): Promise<MessageEmbed> => {
    if (data === undefined) {
        return new MessageEmbed()
            .setTitle("検索に失敗")
            .setDescription("指定されたユーザーを見つけられませんでした。\nヒント：プロフィール機能を無効にしているユーザーやBotユーザーは取得できません。")
    }

    const userData = new MessageEmbed()
        .setTitle(`${data.username} のデータ`)
        .setDescription(data.introduction)
        .addField("フレンドコード", data.friend_code || "未設定")
        .setFooter("自己紹介とフレンドコードは Discord チャンネルから変更できます。")
        .setThumbnail(data.avatar_url)
        .setColor("RANDOM")

    return userData.addFields(await tagFields(tags));
}

const handler = async (interaction: ContextMenuInteraction, database: FirebaseFirestore.Firestore) => {
    const doc = database.doc(`members/${interaction.targetId}`)
    const ref = await doc.get();
    const data = ref.data();

    const tags = await doc.collection("tags").get();
    const response = await embed(data,tags);
    
    await interaction.reply({
        embeds: [
            response.setAuthor("White-Lucida", interaction.user.displayAvatarURL())
        ]
    });
}

const setup = (client: InterfaceWHLBot) => {
    const db = getDb();
    if (db === null) {
        console.error("Firestore の認証データが環境変数に含まれていないため、 プロフィール取得機能はセットアップできません。")
        return;
    }

    client.on("interactionCreate", async interaction => {
        if (!interaction.inGuild()) return;
        if (!interaction.isContextMenu()) return;

        if (interaction.commandName === "プロフィール") {
            await handler(interaction, db);
        }
    });
}

export default setup;