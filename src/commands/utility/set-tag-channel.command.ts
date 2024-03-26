import { type Interaction, SlashCommandBuilder } from "discord.js"

import { prisma } from "~/db"
import { type BaseCommand } from "~/interfaces/base-command.interface"

export class SetTagChannelCommand implements BaseCommand {
	public data = new SlashCommandBuilder()
		.setName("set-tag-channel")
		.setDescription("Set the channel where the tags are sent.")
		.addChannelOption((option) =>
			option.setName("channel").setDescription("The channel where the tags are sent.").setRequired(true)
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
				tagChannel: `${channel.value}`
			},
			create: {
				id: interaction.guildId,
				tagChannel: `${channel.value}`
			}
		})

		await interaction.reply({
			content: `The tag channel has been set to <#${channel.value}> !`,
			ephemeral: true
		})
	}
}
