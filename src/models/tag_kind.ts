import firebase from "firebase-admin";
import { MemberTagModel } from "./member_tag";

interface TagKindModel {
    content: MemberTagModel,
    prominent: boolean
}

const isTagKind = (data: any): data is TagKindModel => {
    const d = data as Partial<TagKindModel>;
    return (
        typeof d?.content === "object" &&
        typeof d?.prominent === "string"
    );
} 

const TagKindConverter: firebase.firestore.FirestoreDataConverter<TagKindModel> = {
    fromFirestore(ss: firebase.firestore.QueryDocumentSnapshot<any>) {
        const data = ss.data();
        if (isTagKind(data)) return data;
        else throw new Error("")
    },
    toFirestore: (model: TagKindModel) => model
};

export { TagKindModel, TagKindConverter }