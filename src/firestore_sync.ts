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
        console.log(flag);
        flag ||= a.username !== b.username;
        console.log(flag);

        flag ||= a.discriminator !== b.discriminator;
        console.log(flag);
        flag ||= a.displayAvatarURL() !== b.displayAvatarURL();
        console.log(flag);
        return flag;
    }
    client.on("userUpdate", async (oldUser, newUser) => {
        console.log("updated")
        if (isProfileUpdated(oldUser, newUser)) {
            const doc = db.doc(`members/${oldUser.id}`);
            console.log(doc);
            await doc.set({
                username: newUser.username,
                discriminator: newUser.discriminator,
                avatar_url: newUser.displayAvatarURL()
            }, { merge: true });
        }
    });
}

export default setup;