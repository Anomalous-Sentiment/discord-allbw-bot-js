const { SlashCommandBuilder } = require('discord.js');
const { fetch } = require('undici');
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes

const sequelize = new Sequelize(process.env.DATABASE_URL);

var Memoria = require('../../models/combined_memoria_list.js')(sequelize, DataTypes);
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
		console.log(json)

		// Parse JSON and get list of JP names
		const jpNames = json[0]['objects'].map((element) => element['name'])
		console.log(jpNames)

		// Search DB for matching JP names
		const memoMatches = await Memoria.findAll({
			attributes: { exclude: ['id'] },
			where: {
				jp_name: jpNames
			}
		})

		console.log(memoMatches)

		await interaction.editReply('Finished');
	},
};