const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetch } = require('undici');
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes

const sequelize = new Sequelize(process.env.DATABASE_URL);

var Memoria = require('../../models/maxed_memoria.js')(sequelize, DataTypes);
console.log(process.env.DATABASE_URL)



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

		// Send to analyzer
		const headers = {'Content-Type': 'image/*'}
		const res = await fetch('https://recognizer.tooler.tokyo/api/v1/recognize', {method: 'POST', body: image1Buffer, headers: headers});
		const json = await res.json();

		// Parse JSON and get list of JP names
		const jpNames = json[0]['objects'].map((element) => element['name'])
		console.log(jpNames)

		// Filter so memoria only appear once (unique_id)
		// card_type <= 4 is VG, higher is RG. Use to filter
		// Use window funciton, over rarity & awakened to get highest form of memo

		// Search DB for matching JP names
		const memoMatches = await Memoria.findAll({
			// attributes: { exclude: ['id'] },
			attributes: ['en_name', 'gvg_en_name', 'gvg_en_desc'],
			where: {
				jp_name: jpNames
			}
		})

		// console.log(memoMatches)
		const embedArray = []
		var embedMsg = null

		var embedMaxFields = 25
		for (let ii = 0; ii < memoMatches.length; ii++) {
			let memo = memoMatches[ii]
			// console.log(memo)
			console.log(ii % embedMaxFields == 0)
			if (ii % embedMaxFields == 0)
			{
				// Push the old embed onto array and create a new embed if limit is reached
				if (embedMsg)
				{
					embedArray.push(embedMsg)
				}
				embedMsg = {
					title: 'Detected Memoria',
					color: 0x0099FF,
					fields: []
				}
				

				// embedMsg = new EmbedBuilder()
				// embedMsg.setTitle('Detected Memoria')
				// .setColor(0x0099FF)
			}
			// embedMsg.addFields({name: memo['en_name'], value: memo['gvg_en_name']})
			embedMsg.fields.push({name: memo['en_name'], value: memo['gvg_en_desc'], inline: true})
		  }

		console.log(embedArray)
		console.log(embedMsg)
		if (embedMsg)
		{
			// Add final embedMsg to array if it exists
			embedArray.push(embedMsg)
		}

		// for (const memo of memoMatches)
		// {
		// 	console.log(memo)
		// 	embedMsg.addFields({name: memo['en_name'], value: memo['gvg_en_name']})
		// }

		if (memoMatches.length > 0)
		{
			await interaction.editReply({ embeds: embedArray });

		}
		else
		{
			await interaction.editReply('Did not detect memoria');
		}
	},
};