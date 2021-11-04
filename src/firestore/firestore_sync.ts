import { PartialUser, User, PermissionFlags, Permissions, GuildMember } from "discord.js";
import { InterfaceWHLBot } from "..";
import { getDb, checkCanUseFirestore } from "./firestore_config";
import { normalize } from "../utils/envs";
import { log } from "../utils/log";
import dotenv from "dotenv";
import { MemberConverter, MemberModel } from "../models/member";

dotenv.config();

const setup = (client: InterfaceWHLBot) => {
    const db = getDb();
    if (db === null) {
        console.error("Firestore の認証データが環境変数に含まれていないため、 Firestore への同期機能はセットアップできません。");
        return;
    }

    type UserType = PartialUser | User;
    const isProfileUpdated = (a: UserType, b: UserType) => {
        
        let flag = false;
        flag ||= a.username !== b.username;
        flag ||= a.discriminator !== b.discriminator;
        flag ||= a.displayAvatarURL() !== b.displayAvatarURL();
        return flag;
    }

    const createDbUserField = (user: User) => ({
        username: user.username,
        discriminator: user.discriminator,
        avatar_url: user.displayAvatarURL({ format: "png" })
    });

    const createDbMemberField = (member: GuildMember): MemberModel => ({
        ...createDbUserField(member.user),
        admin: member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
    });

    client.once("ready", async () => {
        const batch = db.batch();

        const guildId = normalize(process.env.GUILD_ID);
        if (!guildId) return;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        guild.members.cache.each(member => {
            const roleId = normalize(process.env.BOT_OPT_OUT_ROLE_ID);
            if (roleId && member.roles.cache.get(roleId)) {
                return;
            }
            if (member.user.bot) return;
            const ref = db.doc(`members/${member.id}`).withConverter(MemberConverter);
            batch.set(ref, {
                ...createDbMemberField(member),
                friend_code: ""
            }, { merge: true });
        });

        await batch.commit();
    });

    client.on("userUpdate", async (oldUser, newUser) => {
        if (isProfileUpdated(oldUser, newUser)) {
            const doc = db.doc(`members/${oldUser.id}`).withConverter(MemberConverter);
            await doc.set(createDbUserField(newUser), { merge: true });
        }
    });

    client.on("guildMemberAdd", async (member) => {
        const doc = db.doc(`members/${member.id}`).withConverter(MemberConverter);
        await doc.set({ 
            ...createDbMemberField(member)
        }, { merge: true });
    });

    client.on("guildMemberRemove", async (member) => {
        const doc = db.doc(`members/${member.id}`);
        await doc.delete();
    })
}

export default setup;