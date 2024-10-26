const dotenv = require('dotenv');
dotenv.config()

const SequelizeAuto = require('sequelize-auto');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL);
const options = {
    dialect: 'postgres',
    views: true
};

const auto = new SequelizeAuto(sequelize, null, null, options);
auto.run();