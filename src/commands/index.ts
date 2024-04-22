import { SetTreeCommand } from "~/commands/utility/set-tree.command"
import { StatsCommand } from "~/commands/utility/stats.command"
import { type BaseCommand } from "~/interfaces/base-command.interface"

const commands: BaseCommand[] = [new SetTreeCommand(), new StatsCommand()]

export default commands
