# Discord ALLBW Bot JS

A project for creating a discord bot with convenience functions relating to the game Assault Lily Last Bullet W

## Planned Functionality
- Grid analyser (Memoria + Orders)

## Prerequisites

- Requires an existing database created and populated from the [ALLBW DB Project](https://github.com/Anomalous-Sentiment/Mini-ALLBW-DB)

## Setup

Assuming you have setup the database, follow these steps:

1. Create a `.env` file with all variables filled in, using `example.env` as reference. This will be the used for the dev environment. `prod.env` will have the same structure but will be used for the production environment instead.
2. Run `npm install` to install the required packages.
3. Run `npm run dev-introspect` to generate the models that will be used by sequelize using the dev database. Alternatively, run `npm run prod-introspect` to introspect using production database.
4. Run `npm run dev` to start the bot using dev environment variables. Alternatively, use `npm run start` to start the bot using production environment variables

