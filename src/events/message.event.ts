import { type Message, type PartialMessage } from "discord.js"

import { type CustomClient } from "~/interfaces/custom-client.interface"
import { messageValidator } from "~/utils/message-validator"

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

	console.log(description)

	if (description.length === 4) {
		const [_size, _, lastWateredBy, state] = description as [string, string, string, string]

		const isReady = state.includes("**Ready to be watered!**")

		console.log("Is ready to be watered?", isReady)

		if (isReady) {
			// Ping in the tag channel
			console.log("Pinging in the tag channel")

			if (guildConfig.tagChannel) {
				const tagChannel = await client.channels.fetch(guildConfig.tagChannel)

				if (tagChannel?.isTextBased()) {
					await tagChannel.send(`Tree is ready to be watered!`)
				}
			}
		} else {
			// Write regex for "<t:1711412889:R>"
			const regex = /<t:(\d+):R>/
			const match = state.match(regex)

			if (!match) return

			const [, timestamp] = match
			const nextWatering = new Date(parseInt(timestamp as string) * 1000)

			console.log("Next watering:", nextWatering)
		}
	}
}
