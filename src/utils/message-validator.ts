import { type Message, type PartialMessage } from "discord.js"

import { prisma } from "~/db"

export async function messageValidator(message: Message<boolean> | PartialMessage) {
	if (!message.inGuild()) return null
	const { guildId } = message

	const guildConfig = await prisma.guildConfig.findUnique({
		where: {
			id: guildId
		},
		include: {
			tree: true
		}
	})

	if (!guildConfig || !guildConfig.tree) return null

	const { treeChannel, treeBotId } = guildConfig

	if (message.channel.id !== treeChannel || message.author.id !== treeBotId) return null

	return { message, guildConfig }
}
