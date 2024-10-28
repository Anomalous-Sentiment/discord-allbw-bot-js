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

const LANGAUGES = [
    {value: 'en', name: 'EN'},
    {value: 'cn', name: 'CN'},
    {value: 'tw', name: 'TW'},
    {value: 'kr', name: 'KR'},
    {value: 'jp', name: 'JP'},
]

const MAX_EMBED_FIELDS = 25
const MAX_EMBED_SIZE = 6000

const ROLE_MAP = new Map(ROLE_OPTIONS.map(({value, name}) => {
    return [value, name]
}))

console.log(ROLE_MAP)

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Commmand for checking images for memoria or orders')
			.addSubcommand(subcommand =>
				subcommand
				.setName('memoria')
				.setDescription('Detects memoria within the attched images')
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
					)
				.addStringOption((option =>
					option.setName('lang')
						.setDescription('Language to display memoria data')
						.addChoices(...LANGAUGES)
					)))
			.addSubcommand(subcommand => 
				subcommand
				.setName('orders')
				.setDescription('Detects orders within the attched images')
				.addAttachmentOption(option => 
					option.setName('image1').setDescription('Image to analyse').setRequired(true)
				)
				.addAttachmentOption(option => 
					option.setName('image2').setDescription('Second image to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image3').setDescription('Third image to analyse')
				)
				.addStringOption((option =>
					option.setName('lang')
						.setDescription('Language to display memoria data')
						.addChoices(...LANGAUGES)
					))
			),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand()
		console.log(subcommand)

		const t0 = performance.now();
		await interaction.deferReply();
		const image1 = interaction.options.getAttachment('image1')
		const image2 = interaction.options.getAttachment('image2')		
		const image3 = interaction.options.getAttachment('image3')
		const role = interaction.options.getInteger('role')
		const lang = interaction.options.getString('lang')
		const imgArr = [image1, image2, image3]

		
		const analyser = new MemoriaAnalyser(imgArr, lang, role, interaction)
		await analyser.start()

		const t1 = performance.now();
		console.log(`Execution took ${t1 - t0} milliseconds.`);
	},
};

class Analyser {
	constructor(imgArr, lang, role, interaction)
	{
		this.imgArr = imgArr
		this.lang = lang
		this.role = role
		this.interaction = interaction
		this.arrayBuffers = []
	}

	async start()
	{
		let dbData = []
		let jpNames = []

		// Get discord attachments as binary data
		await this.getData()

		// Send the binary data through the API for analysis
		jpNames = await this.analyseData(this.arrayBuffers)

		// Using the returned data (List of JP names detected), retrieve the associated data from out database
		dbData = await this.getDbData(jpNames)

		// Format the data returned from our database and save to class variable
		this.formatResults(dbData)

		// Expects to responds using interaction object
		await this.respond()
	}

	async getData()
	{
		let fetchPromiseArr = []
		let arrayBufferArr = []
		console.log('Getting attachment data...')
		for (const img of this.imgArr)
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
			arrayBufferArr = await Promise.all(fetchPromiseArr)
		this.arrayBuffers = arrayBufferArr
	}

	async analyseData(type)
	{
		let analysisPromiseArr = []
		let uniqueJpNamesArr = []
		console.log(`Analysing data of type: ${type}...`)
		for (const arrayBuffer of this.arrayBuffers)
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

		return uniqueJpNamesArr
	}

	async getDbData()
	{
		console.log('Getting DB data...')
	}

	formatResults()
	{
		console.log('Building embed arrays...')
	}

	async respond()
	{
		console.log('Responding to command...')
	}
}

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
			console.log(unformattedData)

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