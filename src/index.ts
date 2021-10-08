import { Client, ClientOptions, Intents, CommandInteraction } from "discord.js";
import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import { Routes } from "discord-api-types/v9";
import { REST } from "@discordjs/rest";
import dotenv from "dotenv";

import ThreadSetup from "./thread/thread";
import PingSetup from "./ping";
import SyncSetup from "./firestore/firestore_sync";
import ProfileFetchSetup from "./firestore/profile_fetch";

import ProfileCommandJson from "./firestore/profile_command_json";

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;

type CommandBuilder = SlashCommandBuilder | SlashCommandSubcommandBuilder | SlashCommandSubcommandsOnlyBuilder;

interface InterfaceWHLBot extends Client {
	commands: CommandBuilder[]
	addCommand (func: { (interaction: CommandInteraction): void }, builder: CommandBuilder): void
}

class WHLBot extends Client implements InterfaceWHLBot {
	commands: CommandBuilder[]
	constructor(options: ClientOptions) {
		super(options);
		this.commands = [];

		if (process.env.ENABLED_UPDATE_COMMAND === "true") this.updateGuildCommands();
	}

	updateGuildCommands() {
		const rest = new REST({ version: "9" });
		rest.setToken(token);
		
		this.on("ready", async () => {
			const json: any[] = this.commands.map(command => command.toJSON());
			const clientId = this.user?.id;
			json.push(ProfileCommandJson);

			console.log(json);

			console.log(clientId && await rest.put(
				Routes.applicationGuildCommands(clientId, guildId), 
				{ body: json }
			));
		});
	}

	addCommand (func: { (interaction: CommandInteraction): void }, builder: CommandBuilder) {
		this.on("interactionCreate", async interaction => {
			if (!interaction.isCommand()) return;
	
			if (interaction.commandName === builder.name) {
				func(interaction);
			}
		});
		this.commands.push(builder);
	}
}
// Create a new client instance
const client = new WHLBot({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_PRESENCES] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

ThreadSetup(client);
PingSetup(client);
SyncSetup(client);
ProfileFetchSetup(client);

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

export {
	InterfaceWHLBot,
	CommandBuilder
}