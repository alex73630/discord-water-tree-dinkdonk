import { type Client, type Collection } from "discord.js"

import { type BaseCommand } from "~/interfaces/base-command.interface"

export interface CustomClient extends Client {
	commands: Collection<string, BaseCommand>
	editedMessagesTracker: Map<string, string>
}
