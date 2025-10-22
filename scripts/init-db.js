#!/usr/bin/env node

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
}

const targetDatabase = process.env.DB_NAME || 'gunkong_db'

async function initDatabase() {
    console.log('🚀 Starting database initialization...\n')

    const client = new Client({
        ...config,
        database: 'postgres',
    })

    try {
        await client.connect()
        console.log('✅ Connected to PostgreSQL server')

        const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`
        const result = await client.query(checkDbQuery, [targetDatabase])

        if (result.rows.length === 0) {
            console.log(`📦 Creating database: ${targetDatabase}`)
            await client.query(`CREATE DATABASE ${targetDatabase}`)
            console.log(`✅ Database ${targetDatabase} created successfully`)
        } else {
            console.log(`✅ Database ${targetDatabase} already exists`)
        }

        await client.end()

        const dbClient = new Client({
            ...config,
            database: targetDatabase,
        })

        await dbClient.connect()
        console.log(`\n📝 Running migration script on ${targetDatabase}...`)

        const sqlPath = path.join(__dirname, '..', 'database', 'init.sql')
        const sql = fs.readFileSync(sqlPath, 'utf8')

        await dbClient.query(sql)

        await dbClient.end()

        console.log('\n✅ Database initialization completed successfully!')
        console.log(`\n📊 Database: ${targetDatabase}`)
        console.log(`🏠 Host: ${config.host}:${config.port}`)
        console.log(`👤 User: ${config.user}\n`)

        process.exit(0)
    } catch (error) {
        console.error('\n❌ Database initialization failed:')
        console.error(error.message)
        console.error('\n💡 Troubleshooting:')
        console.error('   1. Make sure PostgreSQL is running:')
        console.error('      docker-compose up -d')
        console.error('   2. Check your .env file for correct credentials')
        console.error(`   3. Verify connection: psql -h ${config.host} -p ${config.port} -U ${config.user}\n`)
        
        process.exit(1)
    }
}

initDatabase()
