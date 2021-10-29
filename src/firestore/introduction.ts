import { CommandInteraction, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { InterfaceWHLBot } from "..";
import { getDb } from "./firestore_config";

const setup = (client: InterfaceWHLBot) => {
    const db = getDb();
    if (db === null) {
        console.error("Firestore の認証データが環境変数に含まれていないため、自己紹介の設定機能はセットアップできません。");
        return;
    }
    client.on("messageCreate", async message => {
        if (message.author.bot) return;

        const reply = async (embed: MessageEmbed) => {
            const response = await message.reply({
                embeds: [ embed ]
            });
            setTimeout(() => {
                response.delete()
                .catch(console.error)
            }, 1000 * 10)
        }

        const update = async (data: Object, label: string) => {
            const ref = db.doc(`members/${message.author.id}`);
            const snapShot = await ref.get();
            if (!snapShot.exists) return;
            
            ref.set(data, { merge: true })
            .then(async _ => {
                console.log(_)
                await reply(
                    new MessageEmbed()
                    .setTitle(`${label}を登録しました。`)
                    .setAuthor("White-Lucida", message.author.displayAvatarURL())
                    .setFooter("ヒント：プロフィールはメンバーのアイコンを右クリック（もしくは長押し）で見られます")
                );
            })
        }
        if (message.channelId === process.env.INTRODUCTION_CHANNEL_ID) {
            update({
                introduction: message.content.slice(0, 100)
            }, "自己紹介");
        } else if (message.channelId === process.env.FRIEND_CODE_CHANNEL_ID) {
            update({
                friend_code: message.content.slice(0, 14)  // TODO: 14桁でない可能性もある。正規表現で抜き出す
            }, "フレンドコード");
        }
    })
}

export default setup;