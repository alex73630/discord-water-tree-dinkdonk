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

const MAX_VALID_WAIT_TIME = BigInt(30 * 24 * 60 * 60) // 30 days

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

		const guildIdInput = interaction.options.get("guild-id")

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
				content: "Could not determine the guild ID, please try again or provide a guild ID.",
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

		const waitedTimeTotalAggregate = await prisma.waitedTime.aggregate({
			_sum: {
				waitDelta: true
			},
			_count: {
				waitDelta: true
			},
			where: {
				treeId: tree.id,
				waitDelta: {
					lt: MAX_VALID_WAIT_TIME
				}
			}
		})

		const waitedTimeTotal = waitedTimeTotalAggregate._sum.waitDelta
			? Number(waitedTimeTotalAggregate._sum.waitDelta)
			: 0
		const waitedTimeTotalCount = waitedTimeTotalAggregate._count.waitDelta
		const waitedTimeTotalHumanized = humanizeDuration(waitedTimeTotal * 1000, {
			round: true,
			conjunction: " and ",
			serialComma: false
		})

		const averageWaitedTimeAggregate = await prisma.waitedTime.aggregate({
			_avg: {
				waitDelta: true
			},
			_count: {
				waitDelta: true
			},
			where: {
				treeId: tree.id,
				waitDelta: {
					lt: MAX_VALID_WAIT_TIME
				}
			}
		})

		const averageWaitedTime = averageWaitedTimeAggregate._avg.waitDelta || 0
		const averageWaitedTimeCount = averageWaitedTimeAggregate._count.waitDelta
		const averageWaitedTimeHumanized = humanizeDuration(averageWaitedTime * 1000, {
			round: true,
			conjunction: " and ",
			serialComma: false
		})

		const waitedTimeAverage30DaysAggregate = await prisma.waitedTime.aggregate({
			_avg: {
				waitDelta: true
			},
			_count: {
				waitDelta: true
			},
			where: {
				treeId: tree.id,
				waitDelta: {
					lt: MAX_VALID_WAIT_TIME
				},
				wateredTree: {
					wateredAt: {
						gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
					}
				}
			}
		})

		const waitedTimeAverage30Days = waitedTimeAverage30DaysAggregate._avg.waitDelta || 0
		const waitedTimeAverage30DaysCount = waitedTimeAverage30DaysAggregate._count.waitDelta
		const waitedTimeAverage30DaysHumanized = humanizeDuration(waitedTimeAverage30Days * 1000, {
			round: true,
			conjunction: " and ",
			serialComma: false
		})

		const waitedTimeAverage7DaysAggregate = await prisma.waitedTime.aggregate({
			_avg: {
				waitDelta: true
			},
			_count: {
				waitDelta: true
			},
			where: {
				treeId: tree.id,
				waitDelta: {
					lt: MAX_VALID_WAIT_TIME
				},
				wateredTree: {
					wateredAt: {
						gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
					}
				}
			}
		})

		const waitedTimeAverage7Days = waitedTimeAverage7DaysAggregate._avg.waitDelta || 0
		const waitedTimeAverage7DaysCount = waitedTimeAverage7DaysAggregate._count.waitDelta
		const waitedTimeAverage7DaysHumanized = humanizeDuration(waitedTimeAverage7Days * 1000, {
			round: true,
			conjunction: " and ",
			serialComma: false
		})

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
					value: `${waitedTimeTotalHumanized} (${waitedTimeTotalCount} waterings)`
				},
				{
					name: "Average tracked waited time",
					value: `${averageWaitedTimeHumanized} (${averageWaitedTimeCount} waterings)`
				},
				{
					name: "Average tracked waited time (last 30 days)",
					value: `${waitedTimeAverage30DaysHumanized} (${waitedTimeAverage30DaysCount} waterings)`
				},
				{
					name: "Average tracked waited time (last 7 days)",
					value: `${waitedTimeAverage7DaysHumanized} (${waitedTimeAverage7DaysCount} waterings)`
				}
			])

		await interaction.reply({
			embeds: [embed]
		})
	}
}
