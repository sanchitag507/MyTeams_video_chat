const hbs=require("hbs");
const mongoose=require("mongoose");
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
const user=require('./model.js');
const flash=require('connect-flash');


const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');  
const urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedParser);

mongoose.connect('mongodb+srv://Sanchita:$anchita@123@cluster0.goukn.mongodb.net/test?retryWrites=true&w=majority',{
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
                return done(null,false,{ message: "Password doesnt match !" });
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
        io.to(roomId).emit('buildparticipants');
    //   messages
      socket.on('message', (message,uname) => {
        //send message to the same room
        io.to(roomId).emit('createMessage', message, uname)
      });
      socket.on('disconnect', () => {
          console.log("disconnect user")
        socket.to(roomId).emit('user-disconnected', userId)
        io.to(roomId).emit('buildparticipants');
      })
      socket.on('members', (uname) => {
        // console.log("disconnect user")
        io.to(roomId).emit('participants', uname)
      })
    })
})

//--------------




server.listen(process.env.PORT||4040);



