const { SlashCommandBuilder, underline, codeBlock, hyperlink, embedLength } = require('discord.js');
const { fetch } = require('undici');
const { analyseImage, dbGetMemoriaData } = require('../../helpers/util.js')

console.log(process.env.DATABASE_URL)

const ROLE_OPTIONS = [
    {value: 1, name: 'R. Single Attacker'},
    {value: 2, name: 'R. Multi Attacker'},
    {value: 3, name: 'Sp. Single Attacker'},
    {value: 4, name: 'Sp. Multi Attacker'},
    {value: 5, name: 'Buffer'},
    {value: 6, name: 'Debuffer'},
    {value: 7, name: 'Healer'},
]

const ROLE_MAP = new Map(ROLE_OPTIONS.map(({value, name}) => {
    return [value, name]
}))

console.log(ROLE_MAP)

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
		)
		.addIntegerOption(option =>
			option.setName('role')
				.setDescription('Used to determine which forms of awakened memoria to show (VG or RG forms)')
				.addChoices(...ROLE_OPTIONS)
			),
	async execute(interaction) {
		const embedMaxFields = 25
		const maxEmbedSize = 6000
		const t0 = performance.now();
		await interaction.deferReply();
		const image1 = interaction.options.getAttachment('image1')
		const image2 = interaction.options.getAttachment('image2')		
		const image3 = interaction.options.getAttachment('image3')
		const role = interaction.options.getInteger('role')
		const imgArr = [image1, image2, image3]
		const fetchPromiseArr = []
		const analysisPromiseArr = []
		let uniqueJpNamesArr = []
		const embedArray = []
		const awkEmbedArray = []
		let embedMsgTemplate = {
			title: 'Normal Memoria',
			description: 'Assumes evolved forms. Memoria are not displayed in any particular order.',
			color: 0x0099FF,
			fields: []
		}

		let awkEmbedMsgTemplate = {
			title: 'Detected Possible Awakened Memoria',
			description: 'Displays memoria that might be awakened and all the possible versions. Only one form of the memoria is actually present in the grid',
			color: 0xFF0000,
			fields: []
		}


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
		// Wait for all image to be analysed
		const results = await Promise.all(analysisPromiseArr)

		// Combine all detected JP memoria names into single array
		for (const jpNameArray of results)
		{
			uniqueJpNamesArr = uniqueJpNamesArr.concat(jpNameArray)
		}

		// Filter array to remove duplicates
		uniqueJpNamesArr = [...new Set(uniqueJpNamesArr)];

		// Filter so memoria only appear once (unique_id)
		// card_type <= 4 is VG, higher is RG. Use to filter
		// Use window funciton, over rarity & awakened to get highest form of memo

		// Search DB for matching JP names. Use lang to decide language
		let memoMatches = await dbGetMemoriaData(uniqueJpNamesArr)

		// Check if role was specified
		if (role)
		{
			// Filter awakened & super awakened memoria according to role
			// Define a function for checking whether RG or VG memo
			// Initially set to check for VG
			let roleCheckFunc = (type) => type < 5

			if (role >= 5)
			{
				// If role is RG, change function to check for RG memo
				roleCheckFunc = (type) => type >= 5
			}

			// Apply filter based on role
			memoMatches = memoMatches.filter(memo => {
				if (memo['awakened'] && roleCheckFunc(memo['card_type']))
				{
					// If awakened, return the RG form of the memoria
					return memo
				}
				else if (memo['super_awakened'] && (memo['card_type'] == role))
				{
					// If super awakened, return the memoria that matches their role
					return memo
				}
				else if (!memo['awakened'] && !memo['super_awakened'])
				{
					// Return memo if not awakened or super awakened
					return memo
				}
				// Otherwise, ignore
			})

			// change awk embed title and descriptions
			awkEmbedMsgTemplate.title = `Awakened Memoria (${ROLE_MAP.get(role)} Forms)`
			awkEmbedMsgTemplate.description = `Displays awakened for of memoria aligned with your selected role ${ROLE_MAP.get(role)}`

		}

		let embedMsg = structuredClone(embedMsgTemplate)
		let awkEmbedMsg = structuredClone(awkEmbedMsgTemplate)

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

				// Check if embed exceeds limit
				if (embedLength(awkEmbedMsg) > maxEmbedSize)
				{
					// If exceeded, pop the last fields and create new embed and add the popped field to new embed
					let lastField = awkEmbedMsg.fields.pop()
					awkEmbedArray.push(awkEmbedMsg)
					awkEmbedMsg = {
						title: 'Detected Awakened Memoria',
						color: 0xFF0000,
						fields: [lastField]
					}
				}

				
			}
			else
			{
				if (embedMsg.fields.length != 0 && embedMsg.fields.length % embedMaxFields == 0)
				{
					embedArray.push(embedMsg)
					embedMsg = {
						title: 'Detected Memoria',
						description: 'Assumes evolved forms. Memoria are not displayed in any particular order.',
						color: 0x0099FF,
						fields: []
					}
				}
				// Assumes will never pass 25 elements. If it does pass, extra checks are needed like for awakened memo above
				embedMsg.fields.push(newField)

				// Check if embed exceeds limit
				if (embedLength(embedMsg) > maxEmbedSize)
				{
					// If exceeded, pop the last fields and create new embed and add the popped field to new embed
					let lastField = embedMsg.fields.pop()
					embedArray.push(embedMsg)
					embedMsg = {
						title: 'Detected Memoria',
						description: 'Assumes evolved forms. Memoria are not displayed in any particular order.',
						color: 0x0099FF,
						fields: [lastField]
					}
				}
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
			// Send the first msg with first embed
			await interaction.editReply({ embeds: [embedArray.shift()] });
			for(const embed of embedArray)
			{
				await interaction.followUp({ embeds: [embed] });
			}

			for(const embed of awkEmbedArray)
			{
				await interaction.followUp({ embeds: [embed]})
			}


		}
		else
		{
			await interaction.editReply('Did not detect memoria');
		}
	},
};