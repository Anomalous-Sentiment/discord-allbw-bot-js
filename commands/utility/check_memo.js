const { SlashCommandBuilder, EmbedBuilder, underline, quote, codeBlock, hideLinkEmbed, hyperlink } = require('discord.js');
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
			attributes: ['unique_id', 'en_name', 'gvg_en_name', 'gvg_en_desc', 'auto_en_desc', 'awakened', 'super_awakened'],
			where: {
				jp_name: jpNames
			},
			order: [
				['unique_id', 'DESC'],
			]
		})

		// console.log(memoMatches)
		const embedArray = []
		const awkEmbedArray = []
		var embedMsg = null

		embedMsg = {
			title: 'Detected Memoria',
			description: 'Assumes evolved forms. Memoria are not displayed in any particular order.',
			color: 0x0099FF,
			fields: []
		}

		var awkEmbedMsg = {
			title: 'Detected Possible Awakened Memoria',
			description: 'Displays memoria that might be awakened and all the possible versions. Only one form of the memoria is actually present in the grid',
			color: 0xFF0000,
			fields: []
		}

		var embedMaxFields = 25
		for (let ii = 0; ii < memoMatches.length; ii++) {
			let memo = memoMatches[ii]

			let nameStr = `${underline(memo['en_name'])}`
			let valueStr = `${hyperlink('Wiki Link', `https://assaultlily.wiki/wiki/Last_Bullet:${memo['en_name'].split(' ').join('_')}`)}
			${hyperlink('Mini DB Link (Slow)', `https://www.mini-allbw-db.dev/card/${memo['unique_id']}`)}
			${codeBlock(memo['gvg_en_desc'])}${codeBlock(memo['auto_en_desc'])}`
			let newField = {name: nameStr, value: valueStr, inline: true}

			// Check if awakened/super awakened
			if (memo['awakened'] || memo['super_awakened'])
			{
				if (awkEmbedMsg.fields.length != 0 && awkEmbedMsg.fields.length % embedMaxFields == 0)
				{
					// Push the old embed onto array and create a new embed if limit is reached
					awkEmbedArray.push(awkEmbedMsg)
					awkEmbedMsg = {
						title: 'Detected Awakened Memoria',
						color: 0xFF0000,
						fields: []
					}
				}
				// Add to awakened embed
				awkEmbedMsg.fields.push(newField)
				
			}
			else
			{
				// Assumes will never pass 25 elements. If it does pass, extra checks are needed like for awakened memo above
				embedMsg.fields.push(newField)
			}
		  }

		console.log(embedArray)
		console.log(embedMsg)
		if (embedMsg)
		{
			// Add final embedMsg to array if it exists
			embedArray.push(embedMsg)
		}

		if (awkEmbedMsg)
		{
			// Add final awkEmbedMsg to array if it exists
			awkEmbedArray.push(awkEmbedMsg)
		}

		if (memoMatches.length > 0)
		{
			await interaction.editReply({ embeds: embedArray });
			await interaction.followUp({ embeds: awkEmbedArray})

		}
		else
		{
			await interaction.editReply('Did not detect memoria');
		}
	},
};