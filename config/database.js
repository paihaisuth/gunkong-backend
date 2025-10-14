const { Sequelize } = require('sequelize')
require('dotenv').config()

// Database configuration
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'gunkong_db',

    // Connection pool settings
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },

    logging: false,

    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
    },

    timezone: '+07:00', // Thailand timezone
})

// Test connection
const testConnection = async () => {
    try {
        await sequelize.authenticate()
        console.log('✅ Database connection established successfully.')
        return true
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message)
        console.log(
            '💡 Make sure PostgreSQL is running. You can start it with:'
        )
        console.log('   docker-compose up -d')
        console.log('   or install PostgreSQL locally')
        return false
    }
}

module.exports = { sequelize, testConnection }
