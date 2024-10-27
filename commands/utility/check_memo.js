const { SlashCommandBuilder, EmbedBuilder, underline, quote, codeBlock, hideLinkEmbed, hyperlink } = require('discord.js');
const { fetch } = require('undici');
const { analyseImage, dbGetMemoriaData } = require('../../helpers/util.js')

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
		const t0 = performance.now();
		await interaction.deferReply();
		const image1 = interaction.options.getAttachment('image1')
		const image2 = interaction.options.getAttachment('image2')		
		const image3 = interaction.options.getAttachment('image3')
		const imgArr = [image1, image2, image3]
		const fetchPromiseArr = []
		const analysisPromiseArr = []
		let uniqueJpNamesArr = []

		for (const img of imgArr)
		{
			if (img)
			{
				// Create promise to fetch image if image exists
				// Returns as arrayBuffer
				fetchPromiseArr.push(fetch(img.url)
					.then(res => {
						if (res.ok)
						{
							return res.arrayBuffer()
						}
						else
						{
							throw new Error('Failed to fetch attachment image');
						}

					})
					.catch(err => {
						console.log(err)
					}
				))
			}
		}
		const arrayBufferArr = await Promise.all(fetchPromiseArr)

		for (const arrayBuffer of arrayBufferArr)
		{
			// Create a promise to analyse image for each arrayBufferArr
			if (arrayBuffer)
				{
					// Create promise to fetch image if image exists
					// Returns as arrayBuffer
					analysisPromiseArr.push(analyseImage('memoria', arrayBuffer))
				}

		}

		// Send to analyzer
		// const uniqueJpNamesArr = await analyseImage('memoria', image1Buffer)

		// Wait for all image to be analysed
		const results = await Promise.all(analysisPromiseArr)

		// Combine all detected JP memoria names into single array
		for (const jpNameArray of results)
		{
			uniqueJpNamesArr = uniqueJpNamesArr.concat(jpNameArray)
		}

		// Filter array to remove duplicates
		uniqueJpNamesArr = [...new Set(uniqueJpNamesArr)];



		// Filter results for all unique JP memoria names

		// Filter so memoria only appear once (unique_id)
		// card_type <= 4 is VG, higher is RG. Use to filter
		// Use window funciton, over rarity & awakened to get highest form of memo

		// Search DB for matching JP names. Use lang to decide language
		const memoMatches = await dbGetMemoriaData(uniqueJpNamesArr)
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
			let nameStr = `${underline(memo['name'])}`
			let valueStr = `${hyperlink('Wiki Link', `https://assaultlily.wiki/wiki/Last_Bullet:${memo['name'].split(' ').join('_')}`)}
			${hyperlink('Mini DB Link (Slow)', `https://www.mini-allbw-db.dev/card/${memo['unique_id']}`)}
			${codeBlock(memo['gvg_desc'])}${codeBlock(memo['auto_desc'])}`
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

		const t1 = performance.now();
		console.log(`Execution took ${t1 - t0} milliseconds.`);

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