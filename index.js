// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');


const TOKEN = process.env.DISCORD_TOKEN;


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
        // Get full file path to JS files
		const filePath = path.join(commandsPath, file);
        // Get the command in the diles
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module if both data and execute properties are present
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
    finally {
        // Close client if on serverless deployment
        if(process.env.SERVERLESS == 'true')
        {
            setTimeout(() => client.destroy(), 1200)
        }
    }
});

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	
	// Set custom status
    client.user.setActivity({ type: ActivityType.Custom, emoji: '', name: 'Contemplating my usefulness' })

});

// Log in to Discord with your client's token
client.login(TOKEN);