import { type Interaction, SlashCommandBuilder } from "discord.js"

import { prisma } from "~/db"
import { type BaseCommand } from "~/interfaces/base-command.interface"

export class SetTreeBotCommand implements BaseCommand {
	public data = new SlashCommandBuilder()
		.setName("set-tree-bot")
		.setDescription("Set the tree bot name.")
		.addUserOption((option) => option.setName("bot").setDescription("The tree bot name.").setRequired(true))

	async execute(interaction: Interaction) {
		if (!interaction.isCommand()) return
		const bot = interaction.options.get("bot")
		console.dir(bot, { depth: null })

		if (!bot?.value || !interaction.guildId) {
			await interaction.reply({
				content: "Please provide a channel!",
				ephemeral: true
			})
			return
		}

		await prisma.guildConfig.upsert({
			where: {
				id: interaction.guildId
			},
			update: {
				treeBotId: `${bot.value}`
			},
			create: {
				id: interaction.guildId,
				treeBotId: `${bot.value}`
			}
		})

		await interaction.reply({
			content: `The bot channel has been set to <@${bot.value}> !`,
			ephemeral: true
		})
	}
}
