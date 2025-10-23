const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const session = require('express-session')
const passport = require('./config/passport')
require('dotenv').config()

const { sequelize, testConnection } = require('./config/database')

const routes = require('./routes')
const { errorHandler, notFound } = require('./middleware/errorHandler')

const app = express()

const PORT = process.env.PORT || 8000

app.use(helmet())

const corsOptions = {
    origin: function (origin, callback) {
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true)
        }

        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'https://gunkong-web.vercel.app',
        ].filter(Boolean)

        if (!origin) return callback(null, true)

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            console.log('CORS blocked origin:', origin)
            callback(new Error('Not allowed by CORS'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
    exposedHeaders: ['X-New-Access-Token', 'X-New-Refresh-Token'],
    credentials: true,
}

app.use(cors(corsOptions))

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'gunkong-session-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
)

app.use(passport.initialize())
app.use(passport.session())

app.use('/api', routes)

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Gunkong Backend API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    })
})

app.use(notFound)

app.use(errorHandler)

const startServer = async () => {
    try {
        const dbConnected = await testConnection()

        if (dbConnected) {
            if (process.env.NODE_ENV === 'development') {
                await sequelize.sync({ alter: true })
                console.log('✅ Database synchronized')
            }
        } else {
            console.log('⚠️  Starting server without database connection...')
            console.log(
                '📝 Some features may not work until database is connected'
            )
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`)
            console.log(
                `📝 API Documentation: http://localhost:${PORT}/api/health`
            )
            console.log(
                `🌍 Environment: ${process.env.NODE_ENV || 'development'}`
            )

            if (!dbConnected) {
                console.log('\n💡 To connect database:')
                console.log('   1. Start Docker: open -a Docker')
                console.log('   2. Run: docker-compose up -d')
                console.log('   3. Restart the server')
            }
        })
    } catch (error) {
        console.error('❌ Failed to start server:', error.message)
        process.exit(1)
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...')
    console.error(err.name, err.message)
    process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...')
    console.error(err.name, err.message)
    process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...')
    await sequelize.close()
    process.exit(0)
})

// Start the application
startServer()
