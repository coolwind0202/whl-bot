import { PartialUser, User } from "discord.js";
import { InterfaceWHLBot } from ".";
import { db, checkCanUseFirestore } from "./firestore_config";

const setup = (client: InterfaceWHLBot) => {
    if (!checkCanUseFirestore()) {
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
    client.on("userUpdate", async (oldUser, newUser) => {
        if (isProfileUpdated(oldUser, newUser)) {
            const doc = db.doc(`members/${oldUser.id}`);
            await doc.set({
                username: newUser.username,
                discriminator: newUser.discriminator,
                avatar_url: newUser.displayAvatarURL()
            }, { merge: true });
        }
    });
}

export default setup;