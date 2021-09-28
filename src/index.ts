// const { Client, Intents } = require('discord.js');

import { Client, Intents } from "discord.js";
import dotenv, { config } from "dotenv";

dotenv.config();

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});
console.log(process.env.TOKEN)

// Login to Discord with your client's token
client.login(process.env.TOKEN);