# Discord ALLBW Bot JS

A project for creating a discord bot with convenience functions relating to the game Assault Lily Last Bullet W

## Planned Functionality
- Grid analyser (Memoria + Orders)

## Prerequisites

- Requires an existing database created and populated from the [ALLBW DB Project](https://github.com/Anomalous-Sentiment/Mini-ALLBW-DB)

## Setup

Assuming you have setup the database, follow these steps:

1. Create a `.env` file with all variables filled in, using `example.env` as reference.
2. Run `npm install` to install the required packages.
3. Run `node sequelize-introspect.js` to generate the models that will be used by sequelize.
4. Run `node index.js` to start the bot.
