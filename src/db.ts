import { env } from "~/env"

import { PrismaClient } from "../prisma/client/client.js"

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined
}

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		// log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
	})

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
