const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes
const sequelize = new Sequelize(process.env.DATABASE_URL);
var Memoria = require('../models/maxed_memoria.js')(sequelize, DataTypes);
var Orders = require('../models/combined_orders.js')(sequelize, DataTypes);

module.exports = {
	analyseImage: async (cardType, imageBuffer) => {
		const headers = {'Content-Type': 'image/*'}
        const url = new URL('https://recognizer.tooler.tokyo/api/v1/recognize')
        let jpNames = []
        url.searchParams.set(
            'targets', cardType
        )

		const json = await fetch(url,
        {
            method: 'POST', 
            body: imageBuffer, 
            headers: headers
        })
        .then(res => {
            if (res.ok)
            {
                return res.json()
            }
            else
            {
                throw new Error('Failed to analyse image');
            }

        })
        .catch(err => {
            console.log(err)
        });

        // Parse JSON and get list of JP names
        if (json)
        {
            jpNames = json[0]['objects'].map((element) => element['name'])
        }

        return jpNames
    },
    dbGetMemoriaData: async (jpNames, lang = 'en') => {
        // Search DB for matching JP names
        let columns =  ['unique_id', [`${lang}_name`, 'name'], [`gvg_${lang}_name`, 'gvg_name'], [`gvg_${lang}_desc`, 'gvg_desc'], [`auto_${lang}_desc`, 'auto_desc'], 'card_type', 'attribute', 'en_name', 'jp_name', 'awakened', 'super_awakened']

		const memoMatches = await Memoria.findAll({
			// attributes: { exclude: ['id'] },
			attributes: columns,
			where: {
				jp_name: jpNames
			},
			order: [
				['unique_id', 'DESC'],
			],
            raw: true,
		})
        return memoMatches
    },
    dbGetOrderData: async (jpNames, lang = 'en') => {
        let columns = [
            'unique_id',
            [`${lang}_tactic_name`, 'order_name'],
            [`${lang}_effect_name`, 'skill_name'],
            [`${lang}_effect_desc`, 'skill_desc'],
            'sp',
            'preparation_time',
            'effect_time',
            'jp_tactic_name'
        ]

        const orderMatches = await Orders.findAll({
            attributes: columns,
            where: {
				jp_tactic_name: jpNames
			},
			order: [
				['unique_id', 'DESC'],
			],
            raw: true,
        })

        return orderMatches
    },
    fetchEmojiMap: async (interaction) => {
		const emojiMap = await interaction.client.application.emojis.fetch()
			.then(emojis => {
				// Create a map of the emojis by name
				const newMap = new Map(emojis.map((applicationEmoji) => {
					// console.log(applicationEmoji)
					return [applicationEmoji.name, applicationEmoji]
				}))
				return newMap

			})
			.catch(err => {
				console.log(err)
				// Log the error and return an empty map
				return new Map()
			})

        return emojiMap
    }
};