import {
	Colors,
	EmbedBuilder,
	type GuildMember,
	type Interaction,
	PermissionsBitField,
	SlashCommandBuilder
} from "discord.js"
import humanizeDuration from "humanize-duration"

import { prisma } from "~/db"
import { env } from "~/env"
import { type BaseCommand } from "~/interfaces/base-command.interface"

export class StatsCommand implements BaseCommand {
	public data = new SlashCommandBuilder()
		.setName("stats")
		.setDescription("Get the tracked stats of the tree.")
		.addStringOption((option) =>
			option.setName("guild-id").setDescription("The guild id of the tree.").setRequired(false)
		)

	async execute(interaction: Interaction) {
		if (!interaction.isCommand()) return

		let guildId = interaction.guildId

		const guildIdInput = interaction.options.get("guildId")

		if (guildIdInput?.value) {
			if (!interaction.member) {
				await interaction.reply({
					content: "You must be an administrator to use this command!",
					ephemeral: true
				})
				return
			}

			const member = interaction.member as GuildMember

			if (
				!member.permissions.has(PermissionsBitField.Flags.Administrator) &&
				!env.DISCORD_BOT_ADMINS.includes(member.id)
			) {
				await interaction.reply({
					content: "You must be an administrator to use this command!",
					ephemeral: true
				})
				return
			}

			guildId = guildIdInput.value as string
		}

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

		const waitedTimeAverageRaw = await prisma.$queryRaw<
			{
				treeId: number
				averageWaitedTime: number
			}[]
		>`
			SELECT "treeId", AVG("waitDelta") as "averageWaitedTime"
			FROM "WaitedTime"
			WHERE "treeId" = ${tree.id}
			GROUP BY "treeId"`

		const averageWaitedTime = waitedTimeAverageRaw[0]
		let averageWaitedTimeHumanized = "0 seconds"

		console.log("averageWaitedTime", averageWaitedTime)

		if (averageWaitedTime) {
			const { averageWaitedTime: time } = averageWaitedTime
			console.log("averageWaitedTime", time)
			const averageWaitedTimeDuration = humanizeDuration(time * 1000, {
				round: true,
				conjunction: " and ",
				serialComma: false
			})
			averageWaitedTimeHumanized = averageWaitedTimeDuration
		}

		const waitedTimeAverage30DaysRaw = await prisma.$queryRaw<
			{
				treeId: number
				averageWaitedTime: number
			}[]
		>`
			SELECT "treeId", AVG("waitDelta") as "averageWaitedTime"
			FROM "WaitedTime"
			WHERE "treeId" = ${tree.id} AND "createdAt" >= NOW() - INTERVAL '30 days'
			GROUP BY "treeId"`

		const waitedTimeAverage30Days = waitedTimeAverage30DaysRaw[0]
		let waitedTimeAverage30DaysHumanized = "0 seconds"

		console.log("waitedTimeAverage30Days", waitedTimeAverage30Days)

		if (waitedTimeAverage30Days) {
			const { averageWaitedTime: time } = waitedTimeAverage30Days
			console.log("waitedTimeAverage30Days", time)
			const waitedTimeAverage30DaysDuration = humanizeDuration(time * 1000, {
				round: true,
				conjunction: " and ",
				serialComma: false
			})
			waitedTimeAverage30DaysHumanized = waitedTimeAverage30DaysDuration
		}

		const waitedTimeAverage7DaysRaw = await prisma.$queryRaw<
			{
				treeId: number
				averageWaitedTime: number
			}[]
		>`
			SELECT "treeId", AVG("waitDelta") as "averageWaitedTime"
			FROM "WaitedTime"
			WHERE "treeId" = ${tree.id} AND "createdAt" >= NOW() - INTERVAL '7 days'
			GROUP BY "treeId"`

		const waitedTimeAverage7Days = waitedTimeAverage7DaysRaw[0]
		let waitedTimeAverage7DaysHumanized = "0 seconds"

		console.log("waitedTimeAverage7Days", waitedTimeAverage7Days)

		if (waitedTimeAverage7Days) {
			const { averageWaitedTime: time } = waitedTimeAverage7Days
			console.log("waitedTimeAverage7Days", time)
			const waitedTimeAverage7DaysDuration = humanizeDuration(time * 1000, {
				round: true,
				conjunction: " and ",
				serialComma: false
			})
			waitedTimeAverage7DaysHumanized = waitedTimeAverage7DaysDuration
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
				},
				{
					name: "Average tracked waited time",
					value: averageWaitedTimeHumanized
				},
				{
					name: "Average tracked waited time (last 30 days)",
					value: waitedTimeAverage30DaysHumanized
				},
				{
					name: "Average tracked waited time (last 7 days)",
					value: waitedTimeAverage7DaysHumanized
				}
			])

		await interaction.reply({
			embeds: [embed]
		})
	}
}
