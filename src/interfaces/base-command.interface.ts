import { type Interaction, type SlashCommandBuilder } from "discord.js"

export interface BaseCommand {
	data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
	execute: (interaction: Interaction) => Promise<void> | void
}
