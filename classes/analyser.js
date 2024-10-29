const { fetch } = require('undici');
const { analyseImage, fetchEmojiMap } = require('../helpers/util.js')

// Applying the template design pattern. Other analysers will extend this class
// Allows children to share the common steps of analysing images
class Analyser {
	constructor(imgArr, lang, role, interaction)
	{
		this.imgArr = imgArr
		this.lang = lang
		this.role = role
		this.interaction = interaction
		this.arrayBuffers = []
        this.emojiMap = new Map()
	}

	async start()
	{
		let dbData = []
		let jpNames = []
        let emojiMapPromise = fetchEmojiMap(this.interaction)

		// Get discord attachments as binary data
		await this.getData()

		// Send the binary data through the API for analysis
		jpNames = await this.analyseData()

		// Using the returned data (List of JP names detected), retrieve the associated data from out database
		dbData = await this.getDbData(jpNames)


        // Wait for emojimap promise to resolve before formatting data
        this.emojiMap = await emojiMapPromise
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
		console.log(`Analysing data ...`)
		for (const arrayBuffer of this.arrayBuffers)
			{
				// Create a promise to analyse image for each arrayBufferArr
				if (arrayBuffer)
				{
					// Create promise to fetch image if image exists
					// Returns as arrayBuffer
					analysisPromiseArr.push(analyseImage(type, arrayBuffer))
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

module.exports = {
    Analyser
}