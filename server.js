const hbs=require("hbs");
const mongoose=require("mongoose");
const nodemailer = require('nodemailer');
const express = require('express');
const app=express();
const path=require("path");
app.set("views", path.join(__dirname));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname)));
// app.use('/static', express.static(path.join(__dirname, 'public')));


const passport = require('passport');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const async = require('async');
const crypto = require('crypto');
const user=require('./model2.js');
const flash=require('connect-flash');


const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');  
const urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedParser);

mongoose.connect('mongodb+srv://Sanchita:$anchita@123@cluster0.goukn.mongodb.net/userdatabase?retryWrites=true&w=majority',{
    useNewUrlParser:true,useUnifiedTopology:true
}).then(()=>console.log("database connected")).catch(err => console.log("Can't connect to database "+err));

app.use(cookieParser('secret'));
app.use(session({secret: 'secret', maxAge:3600000, saveUninitialized: true, resave: true}));

app.use(passport.initialize());
app.use(passport.session());
var localstrategy = require('passport-local').Strategy;

app.use(flash())
app.use(function(req,res,next){
    res.locals.success_message=req.flash('success_message');//they are always available otherwise empty
    res.locals.error_message=req.flash('error_message');
    res.locals.error=req.flash('error');
    next();
});

const checkauth=function(req,res,next){
    if(req.isAuthenticated()){
        console.log("authenticated")
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        next();
    }
    else{
        console.log("not authenticated")
        res.redirect("/home");
    }
}
const checkauthenticated=function(req,res,next){
    if(req.isAuthenticated()){
        console.log("authenticated")
        //res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        next();
    }
    else{
        console.log("not authenticated")
        res.redirect("/signin");
    }
}

// const ifauth=function(req,res,next){
//     if(req.isAuthenticated()){
//         console.log("authenticated")
//         res.redirect("/");
//         next();
//     }
//     else{
//         console.log("not authenticated")
//         res.redirect("/signin");
//     }
// }


const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
const { v4: uuidV4 } = require('uuid');

app.use('/peerjs', peerServer);

//---------------------------------------------------

app.get("/home",(req,res)=>{
    console.log("this is home page")
    if(req.user){
        res.redirect("/");
    }
    res.render("home",{roomId:uuidV4});
})

app.get("/signin",(req,res)=>{
    if(req.user){
        res.redirect("/");
    }
    console.log("this is signin page")
    res.render("signin");
})

app.get("/signup",(req,res)=>{
    if(req.user){
        res.redirect("/");
    }
    res.render("signup");
})

app.get('/logout', function(req, res){
    var name = req.user.username;
    console.log("LOGGIN OUT " + req.user.username)
    req.logout();
    // req.session.destroy(function (err) {
    //     res.redirect('/');
    // });
    res.redirect('/');
    req.session.notice = "You have successfully been logged out " + name + "!";
});


app.get("/users/:username",checkauth,(req,res)=>{
    console.log("this is user page")
    // res.redirect("/temp_details");
    res.render("home",{user:req.user,roomId:uuidV4});
})

app.get("/",checkauth,(req,res)=>{
    // res.redirect("/temp_details");
    console.log("this is no page")
    console.log("hiii")
    // redirecttouser(req.user.username)
    res.redirect(`/users/${req.user.username}`);
})



app.post('/signup', urlencodedParser, function (req, res) {
    var {username,email,password,confirmpassword}=req.body;
    var err;
    if(!username||!email||!password){
        err="Please fill all the details !";
        res.render("signup",{err:err});
    }
    if(password!=confirmpassword){
        err="Password and Confirm password do not match !";
        res.render("signup",{err:err});
    }
    if( typeof err=="undefined"){
        user.findOne({email:email},function(err,data){
            if (err){
                console.log("error in finding user");
                console.log(err);
            }
            if(data){
                err="User already exists !";
                res.render("signup",{err:err});
            }else{
                bcrypt.genSalt(10,(err,salt)=>{
                    if(err){
                        console.log("error in salting");
                        console.log(err);
                    }
                    bcrypt.hash(password,salt,(err,hash)=>{
                        if(err){
                            console.log("error in hashing");
                            console.log(err);
                        }
                        password=hash;
                        user({email,username,password}).save((err,data)=>{
                            if(err) throw err;
                            req.flash("success_message","Registered successfully");
                            res.redirect("/signin");
                        });
                    })
                })
            }
        });
    }
    // const msg=req.body.mesg;
    // console.log(msg);
})  


passport.use(new localstrategy({usernameField:'email'},(email,password,done)=>{
    // console.log("hi");
    user.findOne({email:email},(err,data)=>{
        if(err){
            console.log("an error occurred");
            console.log(err)
        }
        if(!data){
            // console.log("user not found");
            return done(null,false,{ message: "User Doesn't Exist !" });
        }
        bcrypt.compare(password,data.password,(err,match)=>{
            if(err){
                // console.log("error");
                console.log(err);
                return done(null,false);
            }
            if(!match){
                // console.log("wrong password");
                return done(null,false,{ message: "Password doesn't match !" });
            }
            if(match){
                // console.log("user found");
                return done(null,data);
            }
        })
    });
}));

passport.serializeUser(function(user,done){
    done(null,user.id);
});

passport.deserializeUser(function(id,done){
    user.findById(id,function(err,user){
        done(err,user);
    });
});

app.post('/signin',function (req, res, next) {
    // var {email,password}=req.body;
    console.log(req.body.email);
    passport.authenticate('local',{
        failureRedirect:"/signin",
        successRedirect:"/",
        failureFlash: true,
    })(req,res,next);
    // const msg=req.body.mesg;
    // console.log(msg);
 })  

//-----------------------------------------------------







//--------------------------------------------------------

app.get("/roomid/:room",checkauthenticated,(req,res)=>{
    console.log("this is room")
    res.render("chatui",{roomId:req.params.room,user:req.user})
})
app.post('/users/joinmeet', urlencodedParser, function (req, res) { 
    const roomcode=req.body.roomcode;
    res.redirect(`/roomid/${roomcode}`); 
 })  
app.post('/joinmeet', urlencodedParser, function (req, res) { 
    const roomcode=req.body.roomcode;
    res.redirect(`/roomid/${roomcode}`); 
 })  

//--------------------------------------------------------

//--------------

io.on('connection', socket => {
    socket.on('join-room', (roomId,userId) => {
        console.log('joined room');
        socket.join(roomId)
        socket.to(roomId).emit('user-connected',userId);
        // io.to(roomId).emit('buildparticipants');
    //   messages
        socket.on('message', (message,uname) => {
        //send message to the same room
            io.to(roomId).emit('createMessage', message, uname)
        });
        socket.on('disconnect', () => {
            console.log("disconnect user")
            socket.to(roomId).emit('user-disconnected', userId)
        // io.to(roomId).emit('buildparticipants');
        })
    //   socket.on('members', (uname) => {
        // console.log("disconnect user")
        // io.to(roomId).emit('participants', uname)
    //   })
    })
})

//--------------

//----------------------------------

app.get('/forgot', function(req, res) {
    res.render('forgot-password', {
      User: req.user
    });
});

app.post('/forgot', function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            user.findOne({ email: req.body.email }, function(err, data) {
                if (!data) {
                    req.flash('error_message', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }
  
                data.resetPasswordToken = token;
                data.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
                data.save(function(err) {
                    done(err, token, data);
                });
            });
        },
        function(token, user, done) {
            // var smtpTransport = nodemailer.createTransport('SMTP', {
            //     service: 'gmail',
            //     auth: {
            //         user: 'ghoshsanchita656@gmail.com',
            //         pass: 'Sanchita@123'
            //     }
            // });
            var smtpTransport = nodemailer.createTransport("smtps://ghoshsanchita656%40gmail.com:"+encodeURIComponent('Sanchita@123') + "@smtp.gmail.com:465");
            var mailOptions = {
                to: user.email,
                from: 'sanchitag507@gmail.com',
                subject: 'Reset your Password',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://' + "myteams-video-chat.herokuapp.com" + '/reset/' + token + '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('success_message', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function(err) {
            if (err) return next(err);
            res.redirect('/forgot');
        });
});

app.get('/reset/:token', function(req, res) {
    user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, data) {
        if (!data) {
            req.flash('error_message', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset-password', {
            token: req.params.token,
            user: req.user
        });
    });
});

app.post('/reset/:token', function(req, res) {
    async.waterfall([
        function(done) {
            user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, data) {
                if (!data) {
                    req.flash('error_message', 'Password reset token is invalid or has expired.');
                    return res.redirect('/forgot');
                }
                var pass=req.body.password;
                var conpass=req.body.confirmpassword;
                if (!pass || !conpass || (pass != conpass)) {
                    req.flash('error_message', 'Passwords dont match !');
                    data.resetPasswordToken = undefined;
                    data.resetPasswordExpires = undefined;
                    data.save(function(err) {
                        return res.redirect('/forgot');
                    });
                }
                bcrypt.genSalt(10,(err,salt)=>{
                    if(err){
                        console.log("error in salting");
                        console.log(err);
                    }
                    bcrypt.hash(pass,salt,(err,hash)=>{
                        if(err){
                            console.log("error in hashing");
                            console.log(err);
                        }
                        data.password = hash;
                        data.resetPasswordToken = undefined;
                        data.resetPasswordExpires = undefined;
                        data.save(function(err) {
                            // req.logIn(data, function(err) {
                            done(err, data);
                            // });
                        });
                    })
                })
  
                // data.password = req.body.password;
                // data.resetPasswordToken = undefined;
                // data.resetPasswordExpires = undefined;
  
            });
        },
        function(user, done) {
            // var smtpTransport = nodemailer.createTransport('SMTP', {
            //     service: 'gmail',
            //     auth: {
            //         user: 'ghoshsanchita656@gmail.com',
            //         pass: 'Sanchita@123'
            //     }
            // });
            var smtpTransport = nodemailer.createTransport("smtps://ghoshsanchita656%40gmail.com:"+encodeURIComponent('Sanchita@123') + "@smtp.gmail.com:465");
            var mailOptions = {
                to: user.email,
                from: 'ghoshsanchita656@gmail.com',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('success_message', 'Success! Your password has been changed.Login');
                done(err);
            });
      }
    ], function(err) {
      res.redirect('/signin');
    });
});

//-----------------------------------







server.listen(process.env.PORT||4040);



