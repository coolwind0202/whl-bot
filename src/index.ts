import { Client, Intents } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});
console.log(process.env.DISCORD_TOKEN);

const getToken = async () => {
	const envToken = process.env.DISCORD_TOKEN;
	try {
		const file = await fs.promises.readFile("/run/secrets/discord_token", "utf-8");
		
		if (file) {
			return file;
		} else if (envToken) {
			return envToken;
		} else return null;

	} catch (e) {
		console.log(e);
		return envToken || null;
	}
}

// Login to Discord with your client's token

const token = getToken();
token
.then(value => {
	if (value) client.login(value)
	else console.error("Bot のトークンが見つかりませんでした。\n" +
		"トークンの設定方法は、 https://github.com/white-lucida/discord_bot/blob/main/README.md を参照してください。"
	);
})
.catch(() => console.error());