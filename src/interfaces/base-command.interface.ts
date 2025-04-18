import { SlashCommandOptionsOnlyBuilder, type Interaction, type SlashCommandBuilder } from "discord.js"

export interface BaseCommand {
	data: SlashCommandOptionsOnlyBuilder
	execute: (interaction: Interaction) => Promise<void> | void
}
