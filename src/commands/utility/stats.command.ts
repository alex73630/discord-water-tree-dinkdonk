import { Colors, EmbedBuilder, type Interaction, SlashCommandBuilder } from "discord.js"
import humanizeDuration from "humanize-duration"

import { prisma } from "~/db"
import { type BaseCommand } from "~/interfaces/base-command.interface"

export class StatsCommand implements BaseCommand {
	public data = new SlashCommandBuilder().setName("stats").setDescription("Get the tracked stats of the tree.")

	async execute(interaction: Interaction) {
		if (!interaction.isCommand()) return

		const guildId = interaction.guildId

		if (!guildId) {
			await interaction.reply({
				content: "Please provide a channel, tag channel, bot and tree name!",
				ephemeral: true
			})
			return
		}

		const guildConfig = await prisma.guildConfig.findFirst({
			where: {
				id: guildId
			},
			include: {
				tree: true
			}
		})

		if (!guildConfig || !guildConfig.tree) {
			await interaction.reply({
				content: "No configured tree found for this server",
				ephemeral: true
			})
			return
		}

		const tree = guildConfig.tree

		const wateredTreeNotifiedCount = await prisma.wateredTree.count({
			where: {
				treeId: tree.id,
				nextWateringNotified: true
			}
		})

		const waitedTimeTotalRaw = await prisma.$queryRaw<
			{
				treeId: number
				waitedTimeTotal: number
			}[]
		>`
			SELECT "treeId", SUM("waitDelta") as "waitedTimeTotal"
			FROM "WaitedTime"
			WHERE "treeId" = ${tree.id}
			GROUP BY "treeId"`

		const waitedTimeTotal = waitedTimeTotalRaw[0]
		let waitedTimeTotalHumanized = "0 seconds"

		console.log("waitedTimeTotal", waitedTimeTotal)

		if (waitedTimeTotal) {
			const { waitedTimeTotal: time } = waitedTimeTotal
			console.log("waitedTimeTotal", time)
			const waitedTimeTotalDuration = humanizeDuration(time * 1000, {
				round: true,
				conjunction: " and ",
				serialComma: false
			})
			waitedTimeTotalHumanized = waitedTimeTotalDuration
		}

		const embed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setTitle(`Stats for ${tree.name}`)
			.addFields([
				{
					name: "Watered tree notified count",
					value: wateredTreeNotifiedCount.toString()
				},
				{
					name: "Total tracked waited time",
					value: waitedTimeTotalHumanized
				}
			])

		await interaction.reply({
			embeds: [embed]
		})
	}
}
