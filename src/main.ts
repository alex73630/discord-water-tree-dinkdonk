import { createClient } from "~/client.js"
import "~/env"

export async function main() {
	await createClient()
}

void main()
