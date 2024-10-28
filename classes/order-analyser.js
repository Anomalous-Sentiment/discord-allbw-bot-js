const { underline, codeBlock, hyperlink, embedLength, bold } = require('discord.js');
const { ROLE_MAP, MAX_EMBED_FIELDS, MAX_EMBED_SIZE } = require('../helpers/constants.js')
const { dbGetOrderData } = require('../helpers/util.js')
const { Analyser } = require('../classes/analyser.js')
class OrderAnalyser extends Analyser {
	constructor(imgArr, lang, role, interaction)
	{
        super(imgArr, lang, role, interaction)
        this.embedMsgArr = []
        this.orderEmbedTemplate = {
            title: 'Orders',
			description: 'Assumes evolved forms. Orders are not displayed in any particular order.',
			color: 0x0099FF,
			fields: []
        }
    }

    async analyseData()
    {
        return await super.analyseData('order')
    }

    async getDbData(uniqueJpNamesArr)
    {
		console.log('Retrieving order data from DB...')
		let orderMatches = []
		// card_type <= 4 is VG, higher is RG. Use to filter

		// Search DB for matching JP names. Use lang to decide language
		orderMatches = await dbGetOrderData(uniqueJpNamesArr, this.lang ? this.lang : 'en')
		return orderMatches
    }

    formatResults(dbData)
    {
        let unformattedData = dbData

        // Clone template
        let embedMsg = structuredClone(this.orderEmbedTemplate)

        // Iterate through data
        for (const orderData of unformattedData)
        {
            // Create new field for order
            let nameStr = orderData['order_name']
            let valueStr = `${bold(underline(orderData['skill_name']))}
            ${hyperlink('TW DB Link', `https://allb.game-db.tw/order/${orderData['jp_tactic_name']}`)}
            ${codeBlock(orderData['skill_desc'])}`
            let newField = { name: nameStr, value: valueStr, inline: true }

            
            if (embedMsg.fields.length < MAX_EMBED_FIELDS)
            {
                // Add fields to embed
                embedMsg.fields.push(newField)
            }
            else
            {
                // If field limit reached, add the embed to array and start new embed
                this.embedMsgArr.push(embedMsg)
                embedMsg = structuredClone(this.orderEmbedTemplate)
                embedMsg.fields.push(newField)
            }

            // If max size reached, pop and create new embed and add back the popped field
            if (embedLength(embedMsg) > MAX_EMBED_SIZE)
            {
                let lastField = embedMsg.fields.pop()
                this.embedMsgArr.push(embedMsg)
                embedMsg = structuredClone(this.orderEmbedTemplate)
                embedMsg.fields.push(lastField)
            }
        }

        // Check if there's still an embed msg that hasn't been pushed
        if (embedMsg.fields.length > 0)
        {
            this.embedMsgArr.push(embedMsg)
        }

    }

    async respond()
    {
        if (this.embedMsgArr.length > 0)
        {
            // Respond with the embeds if exists
            await this.interaction.editReply({ embeds: [this.embedMsgArr.shift()] });

            for (const embedMsg of this.embedMsgArr)
            {
                await this.interaction.followUp({ embeds: [embedMsg]})
            }

        }
        else
        {
            await this.interaction.editReply('Did not detect any orders');
        }
    }
}

module.exports = {
    OrderAnalyser
}