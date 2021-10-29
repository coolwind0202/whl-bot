import { ButtonInteraction, Message, MessageComponentInteraction, SelectMenuInteraction } from "discord.js";

const checkSelectMenu = (interaction: MessageComponentInteraction): interaction is SelectMenuInteraction => {
    if (!interaction.isSelectMenu()) throw new TypeError(`Interaction (${interaction.customId})の型が不正です。`)
    return true;
}

const checkButton = (interaction: MessageComponentInteraction): interaction is ButtonInteraction => {
    if (!interaction.isButton()) throw new TypeError(`Interaction (${interaction.customId})の型が不正です。`)
    return true;
}

export { checkSelectMenu, checkButton };