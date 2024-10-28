const { underline, codeBlock, hyperlink, embedLength } = require('discord.js');
const { ROLE_MAP, MAX_EMBED_FIELDS, MAX_EMBED_SIZE } = require('../helpers/constants.js')
const { analyseImage } = require('../helpers/util.js')
const { Analyser } = require('../classes/analyser.js')
class OrderAnalyser extends Analyser {
	constructor(imgArr, lang, role, interaction)
	{
        super(imgArr, lang, role, interaction)
    }
}

module.exports = {
    OrderAnalyser
}