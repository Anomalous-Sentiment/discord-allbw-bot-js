# Discord ALLBW Bot JS

A project for creating a discord bot with convenience functions relating to the game Assault Lily Last Bullet W

## Functionality
- Memoria & Order Detection
    - Uses the API at https://tooler.tokyo/recognizer to recognise and detect memoria & orders from image attachments
    - Combines list of detections with own database to provide more information

## Commands and Subcommands

- check
    - memoria
    - orders

## Example Bot usage

`/check memoria`
or
`/check orders`

## Prerequisites

- Requires an existing database created and populated from the [ALLBW DB Project](https://github.com/Anomalous-Sentiment/Mini-ALLBW-DB)

## Development Setup

Assuming you have setup the database, follow these steps:

1. Create a `.env` file with all variables filled in, using `example.env` as reference. This will be the used for the dev environment. 
2. Run `npm install` to install the required packages.
3. Run `npm run dev-introspect` to generate the models that will be used by sequelize using the dev database.
4. Deploy and update slash commands. Use `npm run dev-deploy-commands` to update the slash commands used by the dev version of bot.
5. Run `npm run dev` to start the bot using dev environment variables.

## Production Setup

1. Create a `prod.env` file with all variables filled in, using `example.env` as reference. 
2. Run `npm install` to install the required packages.
3. Run `npm run prod-introspect` to generate the models that will be used by sequelize using the production database. 
4. Deploy and update slash commands. Use `npm run prod-deploy-commands` to update the slash commands used by the production version of bot
5. Run `npm run start` to start the bot using production environment variables. 

## Video Demo

https://github.com/user-attachments/assets/f21edd6a-9ae5-4670-a82a-8b87edcaa78c

## Technical Design Notes

Implements the following design patterns:

- Strategy Pattern
    - To swap analyser algorithms at runtime based on the subcommand received.
- Template Method Pattern
    - Using the Analyser as base class that defines the basic template process for analysing and formatting images.
    - Child classes will override the specific steps with their own implementation depending on the type of entity they are detecting.