const { SlashCommandBuilder } = require('discord.js');
const { fetch } = require('undici');


console.log(process.env.DB_CONNECTION_STRING)

// import { Kysely, PostgresDialect } from 'kysely';
// import { DB } from 'kysely-codegen';
// import { Pool } from 'pg';

// const db = new Kysely<DB>({
//   dialect: new PostgresDialect({
//     pool: new Pool({
//       connectionString: process.env.DATABASE_URL,
//     }),
//   }),
// });

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check_memo')
		.setDescription('Detects memoria within the attched image')
		.addAttachmentOption(option => 
			option.setName('image1').setDescription('Image to analyse').setRequired(true)
		)
		.addAttachmentOption(option => 
			option.setName('image2').setDescription('Second image to analyse')
		)
		.addAttachmentOption(option => 
			option.setName('image3').setDescription('Third image to analyse')
		),
	async execute(interaction) {
		await interaction.deferReply();
		const image1 = interaction.options.getAttachment('image1')
		const image2 = interaction.options.getAttachment('image2')		
		const image3 = interaction.options.getAttachment('image3')

		// Get attachments as array buffer
		const image1Res = await fetch(image1.url);
		const image1Buffer = await image1Res.arrayBuffer();

		// try {
		// 	await sequelize.authenticate();
		// 	console.log('Connection has been established successfully.');
		//   } catch (error) {
		// 	console.error('Unable to connect to the database:', error);
		// }

		// Send to analyzer
		const headers = {'Content-Type': 'image/*'}
		const res = await fetch('https://recognizer.tooler.tokyo/api/v1/recognize', {method: 'POST', body: image1Buffer, headers: headers});
		const json = await res.json();
		console.log(json)

		// Parse JSON and get list of JP names
		const jpNames = json[0]['objects'].map((element) => element['name'])
		console.log(jpNames)
		// Search DB for matching JP names
		// const rows = await db.selectFrom('users').selectAll().execute();
		// const memoria = await db
		// 	.selectFrom('combined_memoria_list')
		// 	.selectAll()
		// 	.where('jp_name', 'in', jpNames)
		// 	.execute()
		// console.log(memoria)


		var msg = ''
		console.log(json[0]['objects'])
		if(!json[0]['success'] || json[0]['objects'].length == 0)
		{
			msg = 'No objects detected'
		}
		else
		{
			msg = json[0]['objects']
		}

		await interaction.editReply('Finished');
	},
};