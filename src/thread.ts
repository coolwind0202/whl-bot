import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { Client, CommandInteraction, MessageActionRow, TextChannel, MessageSelectMenu, MessageEmbed, User, MessageComponentInteraction, MessageButton } from "discord.js";
import { InterfaceWHLBot } from ".";
import { getDb } from "./firestore_config";

const handler = async (interaction: CommandInteraction) => {
    const subCommand = interaction.options.getSubcommand();
    if (subCommand === "new") roomCreateHandler(interaction);
    else roomDeleteHandler(interaction);
}

const getThreadPortal = async (client: Client) => {
    const channelId = process.env.THREAD_PORTAL_CHANNEL_ID;
    if (channelId === undefined) {
        console.error("募集用スレッドを作成する親チャンネルのIDが設定されていません。");
        return null;
    }
    const parent = await client.channels.fetch(channelId);
    
    if (parent === null) {
        console.error("募集用スレッドを作成する親チャンネルのIDが誤っています。");
        return null;
    } else if (!(parent instanceof TextChannel)){
        console.error("募集用スレッドを作成する親チャンネルがテキストチャンネルではありません。");
        return null;
    }
    return parent;
}

const matchTypes = ["レギュラーマッチ", "ガチマッチ", "プライベートマッチ", "サーモンラン"] as const
const regularMatchRules = ["ナワバリバトル"] as const
const gachiMatchRules = ["ガチエリア", "ガチヤグラ", "ガチホコ", "ガチアサリ"] as const
const salmonRunRules = ["サーモンラン"] as const

type MatchType = typeof matchTypes[number];
type RegularMatchRule = typeof regularMatchRules[number];
type GachiMatchRule = typeof gachiMatchRules[number];
type PrivateMatchRule = RegularMatchRule | GachiMatchRule;
type SalmonRunRule = typeof salmonRunRules[number];

type AllRule = RegularMatchRule | GachiMatchRule | PrivateMatchRule | SalmonRunRule;

const isMatchType = (type: string): type is MatchType => matchTypes.includes(type as MatchType);
const isRegularMatchRule = (rule: string): rule is RegularMatchRule => regularMatchRules.includes(rule as RegularMatchRule);
const isGachiMatchRule = (rule: string): rule is GachiMatchRule => gachiMatchRules.includes(rule as GachiMatchRule);
const isPrivateMatchRule = (rule: string): rule is PrivateMatchRule => isRegularMatchRule(rule) || isGachiMatchRule(rule);
const isSalmonRunRule = (rule: string): rule is SalmonRunRule => salmonRunRules.includes(rule as SalmonRunRule);

class RoomCreateState {
    interaction: CommandInteraction;
    author: User;
    matchType?: MatchType;
    gameRule?: RegularMatchRule | GachiMatchRule | PrivateMatchRule | SalmonRunRule;
    startTime?: Date

    constructor(interaction: CommandInteraction, author: User) {
        this.interaction = interaction;
        this.author = author;
    }

    _timePadding(n: number) {
        return n.toString().padStart(2, "0")
    }

    _matchExchangeEmoji (match: MatchType) {
        const emojiMap: { [type in MatchType]: string } = {
            "レギュラーマッチ": "852457286462341131",
            "ガチマッチ": "853480634298138664",
            "サーモンラン": "853480486819069952",
            "プライベートマッチ": "853476328329183242"
        }

        return emojiMap[match]
    }

    _ruleExchangeEmoji(rule: AllRule) {
        const emojiMap: { [rule in AllRule]: string } = {
            "ナワバリバトル": "852457286462341131",
            "ガチエリア": "853480634298138664",
            "ガチホコ": "852525700174315530",
            "ガチヤグラ": "852502711530553344",
            "ガチアサリ": "852457284239622145",
            "サーモンラン": "853480486819069952"
        }

        return emojiMap[rule]
    }

    get embed() {
        const hour = this.startTime?.getHours() ?? 0;
        const minute = this.startTime?.getMinutes() ?? 0
        const matchEmojiId = this.matchType ? this._matchExchangeEmoji(this.matchType) : null;
        const ruleEmojiId = this.gameRule ? this._ruleExchangeEmoji(this.gameRule) : null;

        const emojis = this.interaction.guild?.emojis;

        const matchEmoji = matchEmojiId ? emojis?.cache.get(matchEmojiId) : null;
        const ruleEmoji = ruleEmojiId ? emojis?.cache.get(ruleEmojiId) : null;

        return new MessageEmbed()
        .setTitle(`${this.author.username}#${this.author.discriminator} さんの募集（プレビュー）`)
        .addField("マッチの種類", `${matchEmoji ?? ""}${this.matchType ?? "未選択"}`, false)
        .addField("試合のルール", `${ruleEmoji ?? ""}${this.gameRule ?? "未選択"}`, false)
        .addField("開始時刻", 
            `${this._timePadding(hour)} : ${this._timePadding(minute)}`, false)
        .setColor("RANDOM");
    }

    get matchTypeMenu() {
        const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(`match_type ${this.author.id}`)
                .setPlaceholder("マッチの種類")
                .addOptions(matchTypes.map(kind => ({
                    label: kind,
                    emoji: this._matchExchangeEmoji(kind),
                    value: kind
                }))),
        );
        return row;
    }

    get rules(): (RegularMatchRule | GachiMatchRule | PrivateMatchRule | SalmonRunRule)[] | null {
        switch (this.matchType) {
            case "レギュラーマッチ":
                return [...regularMatchRules];
            case "ガチマッチ":
                return [...gachiMatchRules];
            case "プライベートマッチ":
                return [...regularMatchRules, ...gachiMatchRules];
            case "サーモンラン":
                return ["サーモンラン"];
            default:
                return null;
        }
    }

    get ruleMenu() {
        const kinds = this.rules;
        if (kinds === null) return null;

        const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(`game_rule ${this.author.id}`)
                .setPlaceholder("試合のルール")
                .addOptions(kinds.map(kind => ({
                    label: kind,
                    emoji: this._ruleExchangeEmoji(kind),
                    value: kind
                }))),
        );
        return row;
    }

    get startTimeMenu() {
        const base = new Date()
        base.setSeconds(0);
        base.setMinutes(Math.floor(base.getMinutes() / 15) * 15);

        const options: string[] = [];


        for (let i = 0; i < 10; i++) {
            base.setMinutes(base.getMinutes() + 15);
            options.push(`${this._timePadding(base.getHours())} : ${this._timePadding(base.getMinutes())}`);
        }
        const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(`start_time ${this.author.id}`)
                .setPlaceholder("開始時刻")
                .addOptions(options.map(kind => ({
                    label: kind,
                    value: kind
                }))),
        );

        return row;
    }

    get confirmButtons() {
        const row = new MessageActionRow()
		.addComponents(
		    [
                new MessageButton()
                    .setCustomId(`confirm_yes ${this.author.id}`)
                    .setStyle("PRIMARY")
                    .setLabel("はい"),
                new MessageButton()
                    .setCustomId(`confirm_no ${this.author.id}`)
                    .setStyle("DANGER")
                    .setLabel("いいえ（やり直す）")
            ]
		);
        return row;
    }
}

const roomCreateHandler = async (interaction: CommandInteraction) => {
    const state = new RoomCreateState(interaction, interaction.user);
    
    await interaction.reply({ 
        content: "募集を作成します。マッチを選択してください。", 
        components: [ state.matchTypeMenu ],
        embeds: [ state.embed ] 
    });

    const filter = (i: MessageComponentInteraction) => i.channel?.id === interaction.channel?.id && i.user.id === interaction.user.id;

    const collector = interaction.channel?.createMessageComponentCollector({ filter });
    collector?.on("collect", (userInteraction: MessageComponentInteraction) => roomCreateDialogue(state, interaction, userInteraction));
}

const roomCreateDialogue = async (state: RoomCreateState, firstInteraction: CommandInteraction, userInteraction: MessageComponentInteraction) => {
    if (userInteraction.isButton()) {
        switch (userInteraction.customId) {
            case `confirm_yes ${firstInteraction.user.id}`:
                const thread = await createThread(firstInteraction);
                if (thread === undefined) {
                    await userInteraction.update({
                        content: "スレッドの作成に失敗しました。", components: [], embeds: []
                    });
                } else {
                    await thread.send({ embeds: [state.embed] });
                    await userInteraction.update({
                        content: `スレッドを作成しました。 ${thread.toString()}`, components: [], embeds: []
                    })
                }
                return;
            case `confirm_no ${firstInteraction.user.id}`:
                await userInteraction.update({ 
                    content: "マッチを選択してください。", 
                    components: [ state.matchTypeMenu ],
                    embeds: [ state.embed ] 
                });
                return;
        }
    }

    if (!userInteraction.isSelectMenu()) return;
    const value = userInteraction.values[0];
    switch (userInteraction.customId) {
        case `match_type ${firstInteraction.user.id}`:
            if (isMatchType(value)) state.matchType = value;
            await userInteraction.update({ 
                content: "試合のルールを選択してください。", 
                embeds: [state.embed], 
                components: state.ruleMenu !== null ? [state.ruleMenu] : []
            });
            return;
        case `game_rule ${firstInteraction.user.id}`:
            if (isRegularMatchRule(value) && state.matchType === "レギュラーマッチ") state.gameRule = value;
            else if (isGachiMatchRule(value) && state.matchType === "ガチマッチ") state.gameRule = value;
            else if (isSalmonRunRule(value) && state.matchType === "サーモンラン") state.gameRule = value;
            else if (isPrivateMatchRule(value) && state.matchType === "プライベートマッチ") state.gameRule = value;
            await userInteraction.update({
                content: "開始時刻を選択してください。",
                embeds: [state.embed],
                components: [state.startTimeMenu]
            });
            return;
        case `start_time ${firstInteraction.user.id}`:
            const [hour, minute] = value.split(":").map(Number);
            const date = new Date();
            date.setHours(hour);
            date.setMinutes(minute);
            date.setSeconds(0);
            state.startTime = date;
            await userInteraction.update({
                content: "以下の条件でスレッドを作成します。よろしいですか？",
                embeds: [state.embed],
                components: [state.confirmButtons]
            })
            return;
    }
}

const createThread = async (interaction: CommandInteraction) => {
    const parent = await getThreadPortal(interaction.client);
    if (parent === null) return;
    const thread = await parent.threads.create({
        name: "募集チャンネル",
        autoArchiveDuration: 60
    });
    await thread.members.add(interaction.user)
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