import { createEnv } from "@t3-oss/env-core"
import dotenv from "dotenv"
import z from "zod"

dotenv.config()

export const env = createEnv({
	clientPrefix: "PUBLIC_",
	server: {
		NODE_ENV: z.enum(["development", "test", "production"]),
		DISCORD_TOKEN: z.string(),
		DISCORD_CLIENT_ID: z.string(),
		// Required if NODE_ENV is "development"
		DISCORD_GUILD_ID: z.string().optional()
	},
	client: {},
	runtimeEnv: process.env
})
