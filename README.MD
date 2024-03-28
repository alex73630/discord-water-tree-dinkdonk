# Discord Water Tree DinkDonk

A really basic Discord bot that only has one purpose, send a message in a channel when a tree from "Grow a Tree" bot needs to be watered. 

Made for [trash Discord](https://discord.com/invite/WjZhvVbFHM) (join us and help us grow the tree pls)

*Project initialized using the [A8 stack](https://github.com/alex73630/create-a8-app), my personal TypeScript app initializer*

**Note:** This bot is still in development and is not yet ready for public use.

## Setup Instructions

### Requirements
- Node.js 20 or higher
- A Discord bot token with the "Message Content Intent"
- A PostgreSQL database

1. Clone the repository
2. Install the required packages with `npm install`
3. Copy the `.env.example` file to `.env` and fill in the required values
4. (Optional) Start a database with Docker using `docker compose up -d`
5. Initialize your database with `npm run db:push`
6. Run the bot with `npm run start:dev` or `npm run start` (after building the project with `npm run build`)

It also has Docker but I haven't tested it yet, so I can't guarantee it works.

## Commands

The most important command (because it does everything at once) is the `/set-tree` command.

You will need to provide :
- The channel where the tree is located
- The channel where to send the reminder message
- The "Grow a Tree" bot user
- The name of the tree (case sensitive)