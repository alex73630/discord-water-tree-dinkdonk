import { RunCollectorCommand } from "~/commands/utility/run-collector.command"
import { SetTreeBotCommand } from "~/commands/utility/set-bot.command"
import { SetTagChannelCommand } from "~/commands/utility/set-tag-channel.command"
import { SetTreeChannelCommand } from "~/commands/utility/set-tree-channel.command"
import { SetTreeCommand } from "~/commands/utility/set-tree.command"
import { type BaseCommand } from "~/interfaces/base-command.interface"

const commands: BaseCommand[] = [
	new SetTreeChannelCommand(),
	new SetTagChannelCommand(),
	new SetTreeBotCommand(),
	new SetTreeCommand(),
	new RunCollectorCommand()
]

export default commands
