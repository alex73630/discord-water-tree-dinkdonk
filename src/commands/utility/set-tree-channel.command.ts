import { type Interaction, SlashCommandBuilder } from "discord.js"

import { prisma } from "~/db"
import { type BaseCommand } from "~/interfaces/base-command.interface"

export class SetTreeChannelCommand implements BaseCommand {
	public data = new SlashCommandBuilder()
		.setName("set-tree-channel")
		.setDescription("Set the channel where the tree is displayed.")
		.addChannelOption((option) =>
			option.setName("channel").setDescription("The channel where the tree is displayed.").setRequired(true)
		)

	async execute(interaction: Interaction) {
		if (!interaction.isCommand()) return
		const channel = interaction.options.get("channel")
		console.dir(channel, { depth: null })

		if (!channel?.value || !interaction.guildId) {
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
				treeChannel: `${channel.value}`
			},
			create: {
				id: interaction.guildId,
				treeChannel: `${channel.value}`
			}
		})

		await interaction.reply({
			content: `The tree channel has been set to <#${channel.value}> !`,
			ephemeral: true
		})
	}
}
