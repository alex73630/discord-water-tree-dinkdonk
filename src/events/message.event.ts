import dayjs from "dayjs"
import Duration from "dayjs/plugin/duration.js"
import RelativeTime from "dayjs/plugin/relativeTime.js"
import { Colors, EmbedBuilder, type Message, type PartialMessage } from "discord.js"

import { prisma } from "~/db"
import { type CustomClient } from "~/interfaces/custom-client.interface"
import { messageValidator } from "~/utils/message-validator"

dayjs.extend(Duration)
dayjs.extend(RelativeTime)

export const MessageEventHandler = async (message: Message<boolean> | PartialMessage, client: CustomClient) => {
	const response = await messageValidator(message)

	if (!response) return
	const { message: validatedMessage, guildConfig } = response
	const { tree } = guildConfig
	const { embeds } = validatedMessage

	if (embeds.length === 0 || !tree) return

	const embed = embeds.find((embed) => embed.title === tree.name)

	if (!embed?.description) return

	const description = embed.description.split("\n")

	if (description.length === 4) {
		const [_size, _, lastWateredByStr, state] = description as [string, string, string, string]

		const lastWateredByStrRegex = /<@!?(\d+)>/
		const lastWateredByMatch = lastWateredByStr.match(lastWateredByStrRegex)
		if (!lastWateredByMatch) return

		const lastWateredBy = lastWateredByMatch[1] as string

		const isReady = state.includes("**Ready to be watered!**")

		console.log("Tree message received, is ready to be watered?", isReady, guildConfig.id)

		if (isReady) {
			const lastWater = await prisma.wateredTree.findFirst({
				where: {
					guildId: guildConfig.id
				},
				orderBy: {
					createdAt: "desc"
				}
			})
			// Do not ping if there is no last watered
			if (!lastWater) return

			// Check if last watered is the same as previous watered and if it was already pinged
			if (lastWater.wateredBy === lastWateredBy && lastWater?.nextWateringNotified) return

			if (guildConfig.tagChannel) {
				// Ping in the tag channel
				console.log("Pinging in the tag channel", guildConfig.id, guildConfig.tagChannel)
				const tagChannel = await client.channels.fetch(guildConfig.tagChannel)

				if (tagChannel?.isTextBased()) {
					const embed = new EmbedBuilder()
						.setTitle("Tree needs watering!")
						.addFields([
							{
								name: "Tree waiting for water since",
								value: `<t:${Math.floor(lastWater.nextWatering.getTime() / 1000)}:R>`
							},
							{ name: "Last watered by", value: `<@${lastWateredBy}>` }
						])
						.setColor(Colors.Red)

					const message = await tagChannel.send({
						embeds: [embed]
					})

					if (message) {
						await prisma.wateredTree.update({
							where: {
								id: lastWater.id
							},
							data: {
								nextWateringNotified: true,
								nextWateringNotifiedMessageId: message.id
							}
						})
					}
				}
			}
		} else {
			const timestampRegex = /<t:(\d+):R>/
			const timestampMatch = state.match(timestampRegex)

			if (!timestampMatch) return

			const timestamp = timestampMatch[1] as string
			const nextWatering = new Date(parseInt(timestamp) * 1000)

			// Check last wateredTree to make sure we don't create duplicates by comparing nextWatering date
			const lastWateredTree = await prisma.wateredTree.findFirst({
				where: {
					guildId: guildConfig.id
				},
				orderBy: {
					createdAt: "desc"
				}
			})

			if (lastWateredTree?.nextWatering.getTime() === nextWatering.getTime()) return

			console.log("Tree watered, next watering:", nextWatering, guildConfig.id)
			const wateredTree = await prisma.wateredTree.create({
				data: {
					treeId: tree.id,
					guildId: guildConfig.id,
					wateredBy: lastWateredBy,
					wateredAt: message.editedAt || message.createdAt,
					nextWatering
				}
			})

			if (lastWateredTree?.nextWateringNotifiedMessageId) {
				const tagChannel = await client.channels.fetch(guildConfig.tagChannel!)

				if (tagChannel?.isTextBased()) {
					const message = await tagChannel.messages.fetch(
						lastWateredTree.nextWateringNotifiedMessageId as string
					)

					if (message) {
						const timeBetweenWatingAndWater = dayjs
							.duration(dayjs(lastWateredTree.nextWatering).diff(dayjs(wateredTree.wateredAt)))
							.humanize()

						const embed = new EmbedBuilder()
							.setTitle("Tree has been watered!")
							.addFields([
								{
									name: "Tree waited water for",
									value: `${timeBetweenWatingAndWater}`
								},
								{
									name: "Watered by",
									value: `<@${lastWateredBy}>`
								}
							])
							.setColor(Colors.Green)
						await message.edit({
							embeds: [embed]
						})
					}
				}
			}
		}
	}
}
