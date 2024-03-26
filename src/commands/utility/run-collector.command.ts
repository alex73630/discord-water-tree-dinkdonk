import { type Interaction, SlashCommandBuilder } from "discord.js"

import { prisma } from "~/db"
import { type BaseCommand } from "~/interfaces/base-command.interface"

export class RunCollectorCommand implements BaseCommand {
	public data = new SlashCommandBuilder().setName("run-collector").setDescription("Run update collector")

	async execute(interaction: Interaction) {
		if (!interaction.isCommand() || !interaction.inGuild() || !interaction.channel) return

		const guildConfig = await prisma.guildConfig.findUnique({
			where: {
				id: interaction.guildId
			},
			include: {
				tree: true
			}
		})

		if (
			!guildConfig ||
			!guildConfig.treeChannel ||
			!guildConfig.tagChannel ||
			!guildConfig.treeBotId ||
			!guildConfig.tree
		) {
			await interaction.reply({
				content: "Please set the tree channel, tag channel, and tree bot first!",
				ephemeral: true
			})
			return
		}

		const collector = interaction.channel.createMessageCollector({
			filter: (message) =>
				message.author.id === guildConfig.treeBotId &&
				message.channel.id === guildConfig.treeChannel &&
				message.embeds.length > 0 &&
				message.embeds[0]?.title === guildConfig.tree!.name
		})

		collector.on("collect", (message) => {
			console.log("Collected message", message.id)
			console.dir(message.embeds, { depth: null })
		})

		await interaction.reply({
			content: "Collector started!",
			ephemeral: true
		})
	}
}
