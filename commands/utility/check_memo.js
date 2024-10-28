const { SlashCommandBuilder } = require('discord.js');
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
		const t0 = performance.now();
		await interaction.deferReply();
		const image1 = interaction.options.getAttachment('image1')
		const image2 = interaction.options.getAttachment('image2')		
		const image3 = interaction.options.getAttachment('image3')
		const role = interaction.options.getInteger('role')
		const lang = interaction.options.getString('lang')
		const imgArr = [image1, image2, image3]
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