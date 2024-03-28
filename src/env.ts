import { createEnv } from "@t3-oss/env-core"
import dotenv from "dotenv"
import z, { type ZodTypeAny } from "zod"

dotenv.config()

const arrayFromString = (schema: ZodTypeAny) => {
	return z.preprocess((obj) => {
		if (Array.isArray(obj)) {
			return obj as unknown[]
		} else if (typeof obj === "string") {
			return obj.split(",")
		} else {
			return []
		}
	}, z.array(schema))
}

export const env = createEnv({
	clientPrefix: "PUBLIC_",
	server: {
		NODE_ENV: z.enum(["development", "test", "production"]),
		DISCORD_TOKEN: z.string().min(1),
		DISCORD_CLIENT_ID: z.string().min(1),
		// Required if NODE_ENV is "development"
		DISCORD_GUILD_ID: z.string().optional(),
		DISCORD_BOT_ADMINS: arrayFromString(z.string().min(1))
	},
	client: {},
	runtimeEnv: process.env
})
