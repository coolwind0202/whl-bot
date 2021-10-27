import { memberNicknameMention, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { Client, CommandInteraction, MessageActionRow, TextChannel, MessageSelectMenu, MessageEmbed, User, MessageComponentInteraction, MessageButton,
    InteractionUpdateOptions, MessageComponent, Message, Emoji, InteractionReplyOptions, ThreadChannel, InteractionCollector } from "discord.js";
import { InterfaceWHLBot } from "..";
import { getDb } from "../firestore/firestore_config";
import { checkSelectMenu, checkButton } from "../utils/component";
import { EnvVarInvalidError } from "../utils/error";

const handler = async (interaction: CommandInteraction) => {
    const subCommand = interaction.options.getSubcommand();
    if (subCommand === "new") roomCreateHandler(interaction);
    else roomDeleteHandler(interaction);
}

const getThreadPortal = async (client: Client) => {
    const variableName = "THREAD_PORTAL_CHANNEL_ID"
    const channelId = process.env[variableName];
    if (channelId === undefined) {
        throw new EnvVarInvalidError(variableName, "募集用スレッドの親チャンネルの ID が指定されていません。")
    }
    const parent = await client.channels.fetch(channelId);
    
    if (parent === null) {
        throw new EnvVarInvalidError(variableName, "募集用スレッドの親チャンネルの ID が間違っています。")
    } else if (!(parent instanceof TextChannel)){
        throw new EnvVarInvalidError(variableName, "募集用スレッドの親チャンネルがテキストチャンネルではありませんでした。")
    }
    return parent;
}

type CustomId = string;
type EmojiId = string;
type ActionRowChild = MessageButton | MessageSelectMenu;
type ComponentHandler = { (interaction: MessageComponentInteraction): Promise<void> | void };

const matchKinds = ["レギュラーマッチ", "リーグマッチ", "プライベートマッチ", "サーモンラン", "フェスマッチ"] as const
type MatchKind = typeof matchKinds[number];

const matchEmojis = new Map<MatchKind, EmojiId>([
    ["レギュラーマッチ", "852457286462341131"],
    ["リーグマッチ", "895955025942151208"],
    ["サーモンラン", "853480486819069952"],
    ["プライベートマッチ", "853476328329183242"],
    ["フェスマッチ", "895958090799800330"]
]);

const ruleKinds = ["ナワバリバトル", "ガチエリア", "ガチホコ", "ガチヤグラ", "ガチアサリ", "サーモンラン"] as const;
type RuleKind = typeof ruleKinds[number];
const ruleEmojis = new Map<RuleKind, EmojiId>([
    ["ナワバリバトル", "852457286462341131"],
    ["ガチエリア", "853480634298138664"],
    ["ガチホコ", "852525700174315530"],
    ["ガチヤグラ", "852502711530553344"],
    ["ガチアサリ", "852457284239622145"],
    ["サーモンラン", "853480486819069952"]
]);

const ruleRelation = new Map<MatchKind, RuleKind[]>([
    ["レギュラーマッチ", ["ナワバリバトル"]],
    ["リーグマッチ", ["ガチエリア", "ガチホコ", "ガチヤグラ", "ガチアサリ"]],
    ["プライベートマッチ", ["ナワバリバトル", "ガチエリア", "ガチホコ", "ガチヤグラ", "ガチアサリ"]],
    ["サーモンラン", ["サーモンラン"]],
    ["フェスマッチ", ["ナワバリバトル"]]
]);

class State {
    matchKind?: MatchKind;
    ruleKinds: RuleKind[] = [];
    startTime?: Date;
    participantsNumber?: number;
    confirmed: boolean = false;

    joinCount: number = 1;
    thread?: ThreadChannel;
}

class Dialogue {
    interaction: CommandInteraction
    state: State
    handlers: Map<CustomId, ComponentHandler>;
    collector?: InteractionCollector<MessageComponentInteraction>
    db?: FirebaseFirestore.Firestore

    constructor(interaction: CommandInteraction, db?: FirebaseFirestore.Firestore) {
        this.interaction = interaction;
        this.state = new State();

        if (db) this.db = db;

        this.handlers = new Map();

        const filter = (i: MessageComponentInteraction) => i.channel?.id === interaction.channel?.id && i.customId.endsWith(this.interaction.id);

        this.collector = interaction.channel?.createMessageComponentCollector({ filter });
        this.collector?.on("collect", async (userInteraction: MessageComponentInteraction) => {
            if (this.interaction.user === userInteraction.user || userInteraction.customId.startsWith("join_us")) {
                const handler = this.handlers.get(userInteraction.customId);
                if (handler) handler(userInteraction);
            } else {
                await userInteraction.reply({
                    content: "コマンドを実行する権限がありません。",
                    ephemeral: true
                });
            }
        });
    }

    async change(interaction: MessageComponentInteraction, options: InteractionUpdateOptions) {
        await interaction.update(options);
    }

    setHandlerToComponent(component: ActionRowChild, handler: ComponentHandler): ActionRowChild {
        if (component.customId === null) {
            throw new TypeError("コンポーネントに customId が設定されていません。");
        }
        this.handlers.set(component.customId, handler);
        return component;
    }

    matchEmoji(kind: MatchKind | undefined) {
        if (kind === undefined) return "";

        const matchEmojiId = matchEmojis.get(kind)
        if (matchEmojiId === undefined) return "";

        const emoji = this.interaction.guild?.emojis?.cache.get(matchEmojiId) ?? "";
        return emoji;
    }
    
    ruleEmoji(kind: RuleKind | undefined) {
        if (kind === undefined) return "";

        const ruleEmojiId = ruleEmojis.get(kind)
        if (ruleEmojiId === undefined) return "";

        const emoji = this.interaction.guild?.emojis.cache.get(ruleEmojiId) ?? "";
        return emoji;
    }

    get rules() {
        if (!this.state.ruleKinds.length) {
            return "未設定"
        }
        const kinds = this.state.ruleKinds;
        return kinds.map(kind => `${this.ruleEmoji(kind)} ${kind}`).join("\n")
    }

    get startTimeLabel() {
        if (this.state.startTime) {
            const startTime = this.state.startTime
            const hour = startTime.getHours().toString().padStart(2, "0");
            const minute = startTime.getMinutes().toString().padStart(2, "0");
            return `${hour}:${minute}`
        } else {
            return "未設定";
        }
    }

    get participantsNumberLabel() {
        if (!this.state.participantsNumber) return "未設定"
        else return `${this.state.participantsNumber} 人`
    }

    get embed() {
        return new MessageEmbed()
            .setDescription(`${this.interaction.user} さんの募集 ${this.state.confirmed ? "": "（プレビュー）"}`)
            .addField("マッチの種類", `${this.matchEmoji(this.state.matchKind)} ${this.state.matchKind ?? "未設定"}`)
            .addField("試合のルール", this.rules)
            .addField("募集人数", this.participantsNumberLabel)
            .addField("開始時刻", this.startTimeLabel)
            .setAuthor("White-Lucida", this.interaction.user.displayAvatarURL())
            .setColor("RANDOM")
    }

    get matchKindMessage(): InteractionUpdateOptions {
        const options = matchKinds.map(kind => ({
            label: kind,
            emoji: matchEmojis.get(kind) ?? "",
            value: kind
        }));

        const menu = this.setHandlerToComponent(
            new MessageSelectMenu()
                .setCustomId(`match_kind ${this.interaction.id}`)
                .setPlaceholder("マッチの種類")
                .addOptions(options),
            async (matchKindInteraction: MessageComponentInteraction) => {
                if (!checkSelectMenu(matchKindInteraction)) return;

                const value = matchKindInteraction.values[0] as MatchKind;
                if (matchKinds.includes(value))
                    this.state.matchKind = value;
                
                await this.change(matchKindInteraction, this.gameRuleMessage)
            }
        );

        const row = new MessageActionRow().addComponents(menu);
        return {
            content: "マッチの種類を選択してください。",
            components: [ row ],
            embeds: [ this.embed ]
        }
    }

    get gameRuleMessage(): InteractionUpdateOptions {
        if (this.state.matchKind === undefined) throw new TypeError("マッチの種類が選択されていません。");

        const rules = ruleRelation.get(this.state.matchKind);
        if (rules === undefined) throw new TypeError("指定されたマッチの種類に対応するルールが見つかりませんでした。");
        
        const options = rules.map(rule => ({
            label: rule,
            emoji: ruleEmojis.get(rule) ?? "",
            value: rule
        }));

        const isPrivateMatch = this.state.matchKind === "プライベートマッチ";

        const menu = this.setHandlerToComponent(
            new MessageSelectMenu()
                .setCustomId(`game_rule ${this.interaction.id}`)
                .setPlaceholder("試合のルール" + (isPrivateMatch ? "（複数選択可）" : ""))
                .addOptions(options)
                .setMaxValues(isPrivateMatch ? rules.length : 1),
            async (gameRuleInteraction: MessageComponentInteraction) => {
                if (!checkSelectMenu(gameRuleInteraction)) return;
                const values = gameRuleInteraction.values as RuleKind[];

                for (const value of values) {
                    // const value = gameRuleInteraction.values[0] as RuleKind;
                    if (rules.includes(value))
                        this.state.ruleKinds?.push(value)
                }
                await this.change(gameRuleInteraction, this.participantsNumberMessage);
            }
        );

        const row = new MessageActionRow().addComponents(menu);

        return {
            content: "試合のルールを選択してください。",
            components: [ row ],
            embeds: [ this.embed ]
        }
    }

    get participantsNumberMessage(): InteractionUpdateOptions {
        const options: { label: string, value: string }[] = [];
        options.push({ label: "設定しない", value: "none" });
        for (let x = 2; x < 8; x++) options.push({ label: `${x} 人`, value: x.toString() });

        const menu = this.setHandlerToComponent(
            new MessageSelectMenu()
                .setCustomId(`participants_number ${this.interaction.id}`)
                .setPlaceholder("参加人数（希望）")
                .addOptions(options),
            async (participantsNumberInteraction: MessageComponentInteraction) => {
                if (!checkSelectMenu(participantsNumberInteraction)) return;
                const value = participantsNumberInteraction.values[0];
                this.state.participantsNumber = value !== "none" ? Number(value) : undefined;
                await this.change(participantsNumberInteraction, this.startTimeMessage)
            }
        );

        const row = new MessageActionRow().addComponents(menu);

        return {
            content: "希望する参加人数を選択してください。",
            components: [ row ],
            embeds: [ this.embed ]
        }
    }

    get startTimeMessage(): InteractionUpdateOptions {
        const base = new Date()
        base.setSeconds(0);
        base.setMinutes(Math.floor(base.getMinutes() / 15) * 15);

        const optionsMap = new Map<string, Date>();

        for (let i = 0; i < 10; i++) {
            base.setMinutes(base.getMinutes() + 15);
            const label = `${base.getHours().toString().padStart(2, "0")}: ${base.getMinutes().toString().padStart(2, "0")}`
            optionsMap.set(label, new Date(base));
        }

        const options = [...optionsMap.keys()].map(label => ({ label, value: label }));

        const menu = this.setHandlerToComponent(
            new MessageSelectMenu()
                .setCustomId(`start_time ${this.interaction.id}`)
                .setPlaceholder("開始時刻")
                .addOptions(options),
            async (startTimeInteraction: MessageComponentInteraction) => {
                if (!checkSelectMenu(startTimeInteraction)) return;
                const value = startTimeInteraction.values[0]
                if (!optionsMap.has(value)) throw new TypeError("指定された開始時刻が不正でした。");
                this.state.startTime = optionsMap.get(value);

                await this.change(startTimeInteraction, this.confirmMessage)
            }
        );

        const row = new MessageActionRow().addComponents(menu);

        return {
            content: "開始時刻を選択してください。",
            components: [ row ],
            embeds: [ this.embed ]
        }
    }

    get confirmMessage(): InteractionUpdateOptions {
        const yesButton = this.setHandlerToComponent(
            new MessageButton()
                .setCustomId(`confirm_yes ${this.interaction.id}`)
                .setLabel("はい")
                .setStyle("PRIMARY"),
            async (yesInteraction: MessageComponentInteraction) => {
                if (!checkButton(yesInteraction)) return;
                this.state.confirmed = true;

                const thread = await createThread(this.interaction);

                if (thread === undefined) throw new Error("");  /* TODO: コマンド実行時エラー作成 */
                if (this.db !== undefined) {
                    await thread.members.add(this.interaction.user.id)

                    this.state.thread = thread;
                    const ref = this.db.doc(`threads/${thread.id}`);
                    await ref.set({
                        match_kind: this.state.matchKind ?? "未選択",
                        rule_kinds: this.state.ruleKinds,
                        start_time: this.state.startTime ?? null,
                        participants: this.state.participantsNumber ?? 0,
                        owner: this.db.doc(`members/${this.interaction.user.id}`),
                        players: []
                    });
                }
                await this.change(yesInteraction, this.joinUsMessage)
            }
        );
        const noButton = this.setHandlerToComponent(
            new MessageButton()
                .setCustomId(`confirm_no ${this.interaction.id}`)
                .setLabel("いいえ（やり直す）")
                .setStyle("DANGER"),
            async (yesInteraction: MessageComponentInteraction) => {
                if (!checkButton(yesInteraction)) return;
                this.state = new State();
                await this.change(yesInteraction, this.matchKindMessage)
            }
        );

        const row = new MessageActionRow().addComponents([ yesButton, noButton ]);

        return {
            content: "この内容で募集を開始してよろしいですか？",
            components: [ row ],
            embeds: [ this.embed ]
        }
    }

    get joinUsMessage(): InteractionUpdateOptions {
        const participants = this.state.participantsNumber;
        const label = `${this.state.joinCount} 人参加` + (participants !== undefined ? ` / ${participants} 人募集` : "")
        const full = participants && participants <= this.state.joinCount;

        const joinUs = this.setHandlerToComponent(
            new MessageButton()
                .setCustomId(`join_us ${this.interaction.id}`)
                .setLabel(`参加する！ （${label}）`)
                .setStyle(full ? "SUCCESS" : "PRIMARY"),
            async (yesInteraction: MessageComponentInteraction) => {
                if (!checkButton(yesInteraction)) return;

                if (this.db === undefined) return;
                if (this.state.thread === undefined) {
                    await yesInteraction.reply({ content: "参加するスレッドを見つけられませんでした。", ephemeral: true });
                    return;
                }
                const ref = this.db.doc(`threads/${this.state.thread.id}`);
                const doc = await ref.get()
                const data = doc.data();
                
                if (!doc.exists || data === undefined) {
                    await yesInteraction.reply({ content: "募集の参加者リストへの追加に失敗しました。", ephemeral: true });
                    return;
                }

                const isOwner = data.owner.id === yesInteraction.user.id;

                if (isOwner) {
                    await yesInteraction.reply({ content: "自身で作成した募集に参加することはできません。", ephemeral: true });
                    return;
                }

                const alreadyJoined = data.players.some((d: FirebaseFirestore.DocumentReference) => d.id === yesInteraction.user.id);

                if (alreadyJoined) {
                    await yesInteraction.reply({ content: "既に募集に参加しています。", ephemeral: true });
                    return;
                }

                await this.state.thread.members.add(yesInteraction.user)
                await ref.set({
                    players: [...data.players, this.db.doc(`members/${yesInteraction.user.id}`)]
                }, { merge: true });

                this.state.joinCount = data.players.length + 2;
                await this.change(yesInteraction, this.joinUsMessage)
            }
        );

        const deadline = this.setHandlerToComponent(
            new MessageButton()
                .setCustomId(`deadline ${this.interaction.id}`)
                .setLabel("締め切る")
                .setStyle("DANGER"),
            async (deadlineInteraction: MessageComponentInteraction) => {
                if (!checkButton(deadlineInteraction)) return;

                await deadlineInteraction.update({
                    content: "募集を締め切りました。",
                    embeds: [ this.embed ],
                    components: []
                });
                this.collector?.removeAllListeners();

                if (this.db === undefined || this.state.thread === undefined) throw new Error("スレッド締切時のデータ削除に失敗しました。");
                const ref = this.db.doc(`threads/${this.state.thread.id}`);
                await ref.delete();
            }
        );

        const row = new MessageActionRow().addComponents([ joinUs, deadline ]);
        return {
            content: `スレッドを作成しました。${this.state.thread} \n募集についての話し合いや試合中のチャットはここでどうぞ！`,
            components: [ row ],
            embeds: [ this.embed ]
        }
    }
}

const roomCreateHandler = async (interaction: CommandInteraction) => {
    const db = getDb();
    if (db === null) return;

    const helper = new Dialogue(interaction, db);
    await interaction.reply(helper.matchKindMessage as InteractionReplyOptions);
}

const createThread = async (interaction: CommandInteraction) => {
    const parent = await getThreadPortal(interaction.client);
    if (parent === null) return;
    const thread = await parent.threads.create({
        name: "募集チャンネル",
        autoArchiveDuration: 60
    });

    return thread;
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