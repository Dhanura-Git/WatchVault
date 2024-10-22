const passport = require('passport')
const Googlestrategy = require('passport-google-oauth2').Strategy
passport.serializeUser((user, done) => {
    done(null, user)
})
passport.deserializeUser((user, done) => {
    done(null, user)
})
passport.use(new Googlestrategy({
    clientID: process.env.clientId,
    clientSecret: process.env.clientSecret,
    callbackURL: `http://localhost:${process.env.PORT}/auth/google/callback`,
    passReqToCallback: true
},
    function (request, accessToken, refreshToken, profile, done) {
        return done(null, profile)
    }
))  