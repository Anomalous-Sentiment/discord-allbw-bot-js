const { SlashCommandBuilder, ApplicationEmojiManager } = require('discord.js');
const { ROLE_OPTIONS, LANGAUGES } = require('../../helpers/constants.js')
const { MemoriaAnalyser } = require('../../classes/memoria-analyser.js')
const { OrderAnalyser } = require('../../classes/order-analyser.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Commmand for checking images for memoria or orders')
			.addSubcommand(subcommand =>
				subcommand
				.setName('memoria')
				.setDescription('Detects memoria within the attached images')
				.addAttachmentOption(option => 
					option.setName('image1').setDescription('Image to analyse').setRequired(true)
				)
				.addAttachmentOption(option => 
					option.setName('image2').setDescription('Second image to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image3').setDescription('Third image to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image4').setDescription('Fourth mage to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image5').setDescription('Fifth image to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image6').setDescription('Sixth image to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image7').setDescription('Seventh to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image8').setDescription('Eighth image to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image9').setDescription('Ninth image to analyse')
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
				.addAttachmentOption(option => 
					option.setName('image4').setDescription('Fourth mage to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image5').setDescription('Fifth image to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image6').setDescription('Sixth image to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image7').setDescription('Seventh to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image8').setDescription('Eighth image to analyse')
				)
				.addAttachmentOption(option => 
					option.setName('image9').setDescription('Ninth image to analyse')
				)
				.addStringOption((option =>
					option.setName('lang')
						.setDescription('Language to display data in')
						.addChoices(...LANGAUGES)
					))
			),
	async execute(interaction) {
		const t0 = performance.now();
		await interaction.deferReply();
		const image1 = interaction.options.getAttachment('image1')
		const image2 = interaction.options.getAttachment('image2')		
		const image3 = interaction.options.getAttachment('image3')
		const image4 = interaction.options.getAttachment('image4')
		const image5 = interaction.options.getAttachment('image5')		
		const image6 = interaction.options.getAttachment('image6')
		const image7 = interaction.options.getAttachment('image7')
		const image8 = interaction.options.getAttachment('image8')		
		const image9 = interaction.options.getAttachment('image9')
		const role = interaction.options.getInteger('role')
		const lang = interaction.options.getString('lang')
		const imgArr = [image1, image2, image3, image4, image5, image6, image7, image8, image9]
		const subcommand = interaction.options.getSubcommand()
		const analyserMap = new Map([
			['memoria', MemoriaAnalyser],
			['orders', OrderAnalyser]
		])

		// Get the required analyser based on subcommand
		const analyserClass = analyserMap.get(subcommand)
		const analyser = new analyserClass(imgArr, lang, role, interaction)
		await analyser.start()

		const t1 = performance.now();
		if (!interaction.replied)
		{
			throw new Error('Execution finished but failed to respond to interaction!')
		}
		console.log(`Execution took ${t1 - t0} milliseconds.`);
	},
};