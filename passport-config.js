const localStrategy = require('passport-local').Strategy

module.exports = function(passport, user) {
    passport.use(
        new localStrategy({ usernameField: 'email' }, (email, password, done) => {
            try {
                email = user.email
                password = user.password
                if(email != null && password != null) {
                    return done(null, user, {message: 'Logged in successfully!'})
                }
                else {
                    return done(null, false, {message: 'Email or/and Password is/are incorrect!'})
                }
            } 
            catch (error) {
                console.log(error)
            }
        })
    )

    passport.serializeUser((user, done) => done(null, user.id))

    passport.deserializeUser((id, done) => { done(null, user) })

}


// const localStrategy = require('passport-local').Strategy

// function initialize(passport, user) {
//     console.log('initialize 0 : ' + user.logged)
//     const authenticateUser = (email = user.email, done) => {
//         console.log('initialize 1 : ' + user.logged)
//         if(user == null) {
//             return done(null, false, {message: 'No user found!'})
//         }
//         try {
//             return done(null, user)
//         } catch(error) {
//             return done(error)
//         }
//     }
//     console.log('initialize 2 : ' + user.logged)
//     passport.use(new localStrategy({ usernameField: 'email' }, authenticateUser))
//     console.log('initialize 3 : ' + user.logged)
//     passport.serializeUser((user, done) => done(null, user))
//     console.log('initialize 4 : ' + user.logged)
//     passport.deserializeUser((id, done) => { done(null, user.id) })
//     console.log('initialize 5 : ' + user.logged)
// }

// module.exports = initialize