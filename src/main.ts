import { Cron } from "croner"
import dayjs from "dayjs"

import { createClient } from "~/client.js"
import { prisma } from "~/db"
import "~/env"
import { sendTagMessage } from "~/events/message.event"
import { type CustomClient } from "~/interfaces/custom-client.interface"

let client: CustomClient

export async function main() {
	client = await createClient()

	// Remove old edited messages from the tracker to save memory
	const EditedMessageTrackerJob = new Cron("0 */5 * * * *", () => {
		if (!client || !client.isReady()) return

		const now = Date.now()

		for (const [messageId, editedAt] of client.editedMessagesTracker.entries()) {
			const editedAtTime = parseInt(editedAt, 10)
			if (now - editedAtTime > 1000 * 60 * 5) {
				client.editedMessagesTracker.delete(messageId)
			}
		}
	})

	// Check for trees needing water every 30s
	const WaterTreeCheckJob = new Cron("*/30 * * * * *", async () => {
		if (!client || !client.isReady()) return

		const fireDate = Date.now()
		console.log("Checking for trees needing water at", fireDate)

		// Get all the trees and their last "wateredTree" entry
		const trees = await prisma.tree.findMany({
			include: {
				wateredTree: {
					orderBy: {
						createdAt: "desc"
					},
					take: 1
				},
				guildConfig: true
			}
		})

		for (const tree of trees) {
			try {
				const lastWateredTree = tree.wateredTree[0]
				if (!lastWateredTree) {
					console.log("Tree has never been watered", tree.id)
					continue
				}

				const { nextWatering } = lastWateredTree
				const { guildConfig } = tree

				// Deduct a 15 seconds margin to avoid race conditions
				const now = dayjs(fireDate).subtract(15, "seconds").toDate()

				if (nextWatering.getTime() < now.getTime() && !lastWateredTree.nextWateringNotified) {
					console.log("Tree needs watering", tree.id)

					await sendTagMessage(guildConfig, client, lastWateredTree)
				}
			} catch (error) {
				console.warn("Error while checking tree", tree.id, error)
			}
		}
	})
}

void main()
