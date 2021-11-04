import firebase from "firebase-admin";

interface MemberModel {
    username: string
    discriminator: string
    avatar_url: string
    admin: boolean
    friend_code?: string
    introduction?: string
}

function isMember(data: any): data is MemberModel {
    const d = data as Partial<MemberModel>;
    return (
        typeof d?.username === "string" &&
        typeof d?.discriminator=== "string" &&
        typeof d?.avatar_url === "string" &&
        typeof d?.admin === "boolean" &&
        typeof d?.friend_code === "string" || typeof d?.friend_code === "undefined" &&
        typeof d?.introduction === "string" || typeof d?.introduction === "undefined"
    );
}

const MemberConverter: firebase.firestore.FirestoreDataConverter<MemberModel> = {
    fromFirestore(ss: firebase.firestore.QueryDocumentSnapshot<any>) {
        const data = ss.data();
        if (isMember(data)) return data;
        else throw new Error("")
    },
    toFirestore: (model: MemberModel) => model
};

export { MemberModel, MemberConverter }