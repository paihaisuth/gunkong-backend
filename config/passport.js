const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const { User } = require('../models')

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] },
        })
        done(null, user)
    } catch (error) {
        done(error, null)
    }
})

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

if (googleClientId && googleClientSecret) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientId,
                clientSecret: googleClientSecret,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
                scope: ['profile', 'email'],
            },
            async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value
                const googleId = profile.id
                const fullName = profile.displayName
                const profilePicture = profile.photos?.[0]?.value

                if (!email) {
                    return done(new Error('No email found from Google profile'), null)
                }

                let user = await User.findOne({
                    where: { googleId },
                })

                if (user) {
                    await user.update({
                        fullName,
                        profilePicture,
                        email,
                    })
                    return done(null, user)
                }

                const existingUser = await User.findOne({
                    where: { email },
                })

                if (existingUser) {
                    if (existingUser.authProvider === 'local') {
                        await existingUser.update({
                            googleId,
                            authProvider: 'google',
                            profilePicture,
                            fullName: fullName || existingUser.fullName,
                        })
                        return done(null, existingUser)
                    }
                    return done(null, existingUser)
                }

                const username = email.split('@')[0] + '_' + Date.now()

                user = await User.create({
                    email,
                    username,
                    googleId,
                    fullName,
                    profilePicture,
                    authProvider: 'google',
                    role: 'USER',
                    isActive: true,
                })

                return done(null, user)
            } catch (error) {
                console.error('Google OAuth error:', error)
                return done(error, null)
            }
        }
        )
    )
    console.log('✅ Google OAuth is configured and enabled')
} else {
    console.log('⚠️  Google OAuth is disabled - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not configured')
}

module.exports = passport
