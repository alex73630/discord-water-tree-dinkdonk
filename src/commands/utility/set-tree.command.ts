import { type GuildMember, type Interaction, PermissionsBitField, SlashCommandBuilder } from "discord.js"

import { prisma } from "~/db"
import { env } from "~/env"
import { type BaseCommand } from "~/interfaces/base-command.interface"

export class SetTreeCommand implements BaseCommand {
	public data = new SlashCommandBuilder()
		.setName("set-tree")
		.setDescription("Set the tree channel, tag channel, and tree bot.")
		.addChannelOption((option) =>
			option.setName("channel").setDescription("The channel where the tree is displayed.").setRequired(true)
		)
		.addChannelOption((option) =>
			option.setName("tag-channel").setDescription("The channel where the tags are sent.").setRequired(true)
		)
		.addUserOption((option) => option.setName("bot").setDescription("The tree bot name.").setRequired(true))
		.addStringOption((option) =>
			option.setName("tree-name").setDescription("The name of the tree.").setRequired(false)
		)

	async execute(interaction: Interaction) {
		if (!interaction.isCommand()) return

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

		const channel = interaction.options.get("channel")
		const tagChannel = interaction.options.get("tag-channel")
		const bot = interaction.options.get("bot")
		const treeName = interaction.options.get("tree-name")

		if (!channel?.value || !tagChannel?.value || !bot?.value || !interaction.guildId || !treeName?.value) {
			await interaction.reply({
				content: "Please provide a channel, tag channel, bot and tree name!",
				ephemeral: true
			})
			return
		}

		const tagChannelItem = await interaction.client.channels.fetch(tagChannel.value as string)

		if (tagChannelItem && !tagChannelItem.isSendable()) {
			await interaction.reply({
				content: "The tag channel must be a text channel and bot must have permission to send messages in!",
				ephemeral: true
			})
			return
		}

		await prisma.guildConfig.upsert({
			where: {
				id: interaction.guildId
			},
			update: {
				treeChannel: `${channel.value}`,
				tagChannel: `${tagChannel.value}`,
				treeBotId: `${bot.value}`
			},
			create: {
				id: interaction.guildId,
				treeChannel: `${channel.value}`,
				tagChannel: `${tagChannel.value}`,
				treeBotId: `${bot.value}`
			}
		})

		await prisma.tree.upsert({
			where: {
				guildId: interaction.guildId
			},
			update: {
				name: `${treeName.value}`
			},
			create: {
				name: `${treeName.value}`,
				guildId: interaction.guildId
			}
		})

		await interaction.reply({
			content: `The tree channel has been set to <#${channel.value}>, the tag channel has been set to <#${tagChannel.value}>, and the bot has been set to <@${bot.value}> !`,
			ephemeral: true
		})
	}
}
