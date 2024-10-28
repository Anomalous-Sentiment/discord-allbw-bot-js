const { underline, codeBlock, hyperlink, embedLength } = require('discord.js');
const { ROLE_MAP, MAX_EMBED_FIELDS, MAX_EMBED_SIZE } = require('../helpers/constants.js')
const { dbGetMemoriaData } = require('../helpers/util.js')
const { Analyser } = require('../classes/analyser.js')

class MemoriaAnalyser extends Analyser {
	constructor(imgArr, lang, role, interaction)
	{
		super(imgArr, lang, role, interaction)
		this.embedArray = []
		this.awkEmbedArray = []
		this.embedMsgTemplate = {
			title: 'Normal Memoria',
			description: 'Assumes evolved forms. Memoria are not displayed in any particular order.',
			color: 0x0099FF,
			fields: []
		}

		this.awkEmbedMsgTemplate = {
			title: 'Detected Possible Awakened Memoria',
			description: 'Displays memoria that might be awakened and all the possible versions. Only one form of the memoria is actually present in the grid',
			color: 0xFF0000,
			fields: []
		}
	}

	async analyseData()
	{
		console.log('Getting mamoria analysed...')
		return await super.analyseData('memoria')
	}

	async getDbData(uniqueJpNamesArr)
	{
		console.log('Retrieving memoria data from DB...')
		let memoMatches = []
		// card_type <= 4 is VG, higher is RG. Use to filter

		// Search DB for matching JP names. Use lang to decide language
		memoMatches = await dbGetMemoriaData(uniqueJpNamesArr, this.lang ? this.lang : 'en')
		return memoMatches
	}

	formatResults(dbData)
	{
		let unformattedData = dbData
		console.log('Formatting memoria data...')

		// Check if role was specified
		if (this.role)
		{
			// Filter awakened & super awakened memoria according to role
			// Define a function for checking whether RG or VG memo
			// Initially set to check for VG
			let roleCheckFunc = (type) => type < 5

			if (this.role >= 5)
			{
				// If role is RG, change function to check for RG memo
				roleCheckFunc = (type) => type >= 5
			}

			// Apply filter based on role
			unformattedData = dbData.filter(memo => {
				if (memo['awakened'] && roleCheckFunc(memo['card_type']))
				{
					// If awakened, return the RG form of the memoria
					return memo
				}
				else if (memo['super_awakened'] && (memo['card_type'] == this.role))
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
			this.awkEmbedMsgTemplate.title = `Awakened Memoria (${ROLE_MAP.get(this.role)} Forms)`
			this.awkEmbedMsgTemplate.description = `Displays awakened for of memoria aligned with your selected role (${ROLE_MAP.get(this.role)})`

		}

		let embedMsg = structuredClone(this.embedMsgTemplate)
		let awkEmbedMsg = structuredClone(this.awkEmbedMsgTemplate)

		for (let ii = 0; ii < unformattedData.length; ii++) {
			let memo = unformattedData[ii]
			let nameStr = `${underline(memo['name'])}`
			let valueStr = `${hyperlink('Wiki Link', `https://assaultlily.wiki/wiki/Last_Bullet:${memo['en_name'].split(' ').join('_')}`)}
			${hyperlink('TW DB Link', `https://allb.game-db.tw/memoria/${memo['jp_name']}`)}
			${hyperlink('Mini DB Link (Slow)', `https://www.mini-allbw-db.dev/card/${memo['unique_id']}`)}
			${codeBlock(memo['gvg_desc'])}${codeBlock(memo['auto_desc'])}`
			let newField = {name: nameStr, value: valueStr, inline: true}

			// Check if awakened/super awakened
			if (memo['awakened'] || memo['super_awakened'])
			{
				if (awkEmbedMsg.fields.length != 0 && awkEmbedMsg.fields.length % MAX_EMBED_FIELDS == 0)
				{
					// Push the old embed onto array and create a new embed if fields limit is reached
					this.awkEmbedArray.push(awkEmbedMsg)
					awkEmbedMsg = {
						title: 'Detected Awakened Memoria',
						color: 0xFF0000,
						fields: []
					}
				}
				// Add to awakened embed
				awkEmbedMsg.fields.push(newField)

				// Check if embed exceeds limit
				if (embedLength(awkEmbedMsg) > MAX_EMBED_SIZE)
				{
					// If exceeded, pop the last fields and create new embed and add the popped field to new embed
					let lastField = awkEmbedMsg.fields.pop()
					this.awkEmbedArray.push(awkEmbedMsg)
					awkEmbedMsg = {
						title: 'Detected Awakened Memoria',
						color: 0xFF0000,
						fields: [lastField]
					}
				}

				
			}
			else
			{
				if (embedMsg.fields.length != 0 && embedMsg.fields.length % MAX_EMBED_FIELDS == 0)
				{
					this.embedArray.push(embedMsg)
					embedMsg = {
						title: 'Detected Memoria',
						description: 'Assumes evolved forms. Memoria are not displayed in any particular order.',
						color: 0x0099FF,
						fields: []
					}
				}

				embedMsg.fields.push(newField)

				// Check if embed exceeds limit
				if (embedLength(embedMsg) > MAX_EMBED_SIZE)
				{
					// If exceeded, pop the last fields and create new embed and add the popped field to new embed
					let lastField = embedMsg.fields.pop()
					this.embedArray.push(embedMsg)
					embedMsg = {
						title: 'Detected Memoria',
						description: 'Assumes evolved forms. Memoria are not displayed in any particular order.',
						color: 0x0099FF,
						fields: [lastField]
					}
				}
			}
		}

		if (embedMsg.fields.length > 0)
		{
			// Add final embedMsg to array if it exists
			this.embedArray.push(embedMsg)
		}

		if (awkEmbedMsg.fields.length > 0)
		{
			// Add final awkEmbedMsg to array if it exists
			this.awkEmbedArray.push(awkEmbedMsg)
		}
	}

	async respond()
	{
		console.log('Responding with memoria... ')
		if (this.awkEmbedArray.length > 0 || this.embedArray.length > 0)
		{
			// Send the first msg with first embed
			await this.interaction.editReply({ embeds: [this.embedArray.shift()] });

			for(const embed of this.embedArray)
			{
				await this.interaction.followUp({ embeds: [embed] });
			}

			for(const embed of this.awkEmbedArray)
			{
				await this.interaction.followUp({ embeds: [embed]})
			}


		}
		else
		{
			await this.interaction.editReply('Did not detect memoria');
		}
	}
}

module.exports = {
    MemoriaAnalyser
}