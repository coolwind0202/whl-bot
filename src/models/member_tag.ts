import firebase from "firebase-admin";

interface MemberTagModel {
    title: string,
    description: string
}

const isMemberTag = (data: any): data is MemberTagModel => {
    const d = data as Partial<MemberTagModel>;
    return (
        typeof d?.title === "string" &&
        typeof d?.description === "string"
    );
} 

const MemberTagConverter: firebase.firestore.FirestoreDataConverter<MemberTagModel> = {
    fromFirestore(ss: firebase.firestore.QueryDocumentSnapshot<any>) {
        const data = ss.data();
        if (isMemberTag(data)) return data;
        else throw new Error("")
    },
    toFirestore: (model: MemberTagModel) => model
};

export { MemberTagModel, MemberTagConverter }