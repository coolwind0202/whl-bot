import { Client, ClientOptions, Intents, CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import dotenv from "dotenv";

dotenv.config();

interface InterfaceWHLBot extends Client {
	commands: []
	addCommand (func: { (interaction: CommandInteraction): void }, builder: SlashCommandBuilder): void
}

class WHLBot extends Client implements InterfaceWHLBot {
	commands: []
	constructor(options: ClientOptions) {
		super(options);
		this.commands = [];
	}

	addCommand (func: { (interaction: CommandInteraction): void }, builder: SlashCommandBuilder) {
		this.on("interactionCreate", async interaction => {
			if (!interaction.isCommand()) return;
	
			if (interaction.commandName === builder.name) {
				func(interaction);
			}
		});
	}
}
// Create a new client instance
const client = new WHLBot({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});
console.log(process.env.DISCORD_TOKEN);

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

export {
	InterfaceWHLBot
}