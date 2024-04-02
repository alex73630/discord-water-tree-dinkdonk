import {
	type RedisClientType,
	type RedisFunctions,
	type RedisModules,
	type RedisScripts,
	createClient as createRedisClient
} from "@redis/client"
import { Client, type ClientOptions, Collection, Events, GatewayIntentBits, Partials, REST, Routes } from "discord.js"

import commands from "~/commands/index"
import { env } from "~/env"
import { MessageEventHandler } from "~/events/message.event"
import { type CustomClient } from "~/interfaces/custom-client.interface"

const registerCommands = async () => {
	try {
		const restClient = new REST().setToken(env.DISCORD_TOKEN)

		const commandsPayload = commands.map((command) => command.data.toJSON())

		if (env.NODE_ENV === "development") {
			if (!env.DISCORD_GUILD_ID) {
				throw new Error("DISCORD_GUILD_ID is required in development mode.")
			}

			console.log("Registering commands in development mode.")

			await restClient.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID), {
				body: commandsPayload
			})

			console.log(`Registered ${commands.length} commands in development mode.`)
		}

		if (env.NODE_ENV === "production") {
			console.log("Registering commands in production mode.")

			await restClient.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
				body: commandsPayload
			})

			console.log(`Registered ${commands.length} commands in production mode.`)
		}
	} catch (error) {
		console.error(error)
	}
}

let redis: RedisClientType<RedisModules, RedisFunctions, RedisScripts>

export const createClient = async (options?: ClientOptions) => {
	if (!redis) {
		redis = await createRedisClient({
			url: env.REDIS_URL
		})
			.on("error", (err) => console.log("Redis Client Error", err))
			.on("connect", () => console.log("Redis Client Connected"))
			.connect()
	}

	const client = new Client({
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
		partials: [Partials.Message, Partials.Channel],
		...options
	}) as CustomClient

	client.commands = new Collection()

	commands.map((command) => {
		client.commands.set(command.data.name, command)
	})

	await registerCommands()

	client.once(Events.ClientReady, (readyClient) => {
		console.log(`Ready! Logged in as ${readyClient.user.tag}`)
	})

	client.on(Events.MessageCreate, async (message) => {
		console.log("New message received", message.guildId, message.id)
		if (message.partial) {
			console.log("Partial message received. Ignoring for now.", message.guildId, message.id)
			return
		} else {
			await MessageEventHandler(message, client)
		}
	})
	client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
		console.log("Message updated", newMessage.guildId, newMessage.id, newMessage.editedAt)

		// Poor man fix to the duplicate updateMessage event
		const lastEdited = await redis.get(`last_edited:${newMessage.id}`)
		if (lastEdited && newMessage.editedAt?.getTime().toString() === lastEdited) {
			console.log("Message was already edited. Ignoring.", newMessage.guildId, newMessage.id)
			return
		}
		await redis.set(`last_edited:${newMessage.id}`, newMessage.editedAt!.getTime().toString(), {
			// Expire in 1 day
			EX: 86400
		})

		await MessageEventHandler(newMessage, client)
	})

	client.on(Events.InteractionCreate, async (interaction) => {
		if (!interaction.isChatInputCommand()) return

		const command = client.commands.get(interaction.commandName)

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`)

			await interaction.reply({
				content: "There was an error while executing this command!",
				ephemeral: true
			})
			return
		}

		try {
			await command.execute(interaction)
		} catch (error) {
			console.error(error)
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: "There was an error while executing this command!",
					ephemeral: true
				})
			} else {
				await interaction.reply({
					content: "There was an error while executing this command!",
					ephemeral: true
				})
			}
		}
	})

	await client.login(env.DISCORD_TOKEN)
	return client
}
