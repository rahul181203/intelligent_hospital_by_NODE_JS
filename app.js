const express = require('express');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBsession = require('connect-mongodb-session')(session);
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
const mongoUri = "mongodb://localhost:27017/hospitalDB";

mongoose.connect(mongoUri,
{useNewUrlParser:true,
    // useCreateIndex:true,
    useUnifiedTopology:true,
})

const store = new MongoDBsession({
    uri:mongoUri,
    collection:"mySessions",
})

app.use(session({
    secret:"key that will sign cookies",
    resave:false,
    saveUninitialized:false,
    store:store,
}))

const userSchema = new mongoose.Schema({
    name:String,
    mail:String,
    type:String,
    password:String,
})
const Userp = new mongoose.model("Userp",userSchema);
const Userd = new mongoose.model("Userd",userSchema);

const diseaseSchema = new mongoose.Schema({
    name:String,
    mail:String,
    age:String,
    gender:String,
    bp:String,
    description:String,
    prescription:String,
})
const Disease = new mongoose.model("Disease",diseaseSchema);

const isAuth = (req,res,next) => {
    if(req.session.isAuth){
        next()
    }else{
        res.redirect('/login')
    }
}

app.get('/',function(req,res){
    res.render('home');
})
app.get('/login',function(req,res){
    res.render('login',{msg:''});
})
app.get('/register',function(req,res){
    res.render('signup');
})
app.get('/post',isAuth,function(req,res){
    res.render('userform');
})
app.get('/main',isAuth,function(req,res){
    res.render('main');
})

app.get('/home',isAuth,function(req,res){
    res.render('partials/doctor');
})

app.get('/details',isAuth,function(req,res){
    Disease.find({},function(err,foundUsers){
        if(err){
            console.log(err);
        }else{
            // console.log(foundUsers);
            res.render('pdetails',{posts:foundUsers})
        }
    })
})

app.get('/logout',function(req,res){
    req.session.destroy((err) => {
        if(err) throw err;
        res.redirect('/');
    })
})

app.get('/recent',isAuth,function(req,res){
    const username = app.get('data');
    // console.log(username);
    Disease.findOne({mail:username},function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            // console.log(foundUser);
            res.render('recent',{post:[foundUser]});
        }
    })
    
})

app.get('/recent/:topic',isAuth,function(req,res){
    let head = _.lowerCase(req.params.topic);
    Disease.find({},function(err,foundUsers){
        if(err){
            console.log(err);
        }else{
            foundUsers.forEach(function(user){
                if(head===_.lowerCase(user.id)){
                    res.render('userpdetails',{detail:user})
                }
            })
        }
    })
})

app.get('/details/:topic',isAuth,function(req,res){
    let head = _.lowerCase(req.params.topic);
    Disease.find({},function(err,foundUsers){
        if(err){
            console.log(err);
        }else{
            foundUsers.forEach(function(user){
                if(head===_.lowerCase(user.id)){
                    res.render('pagedetail',{detail:user})
                }
            })
        }
    })
})

app.post('/register',function(req,res){
    type = req.body.type;
    password = req.body.pass;
    cpassword = req.body.cpass;
    if(type === 'doctor'){
        if(password===cpassword){
            bcrypt.hash(password,12,function(err,hash){
                const user = new Userd({
                    name:req.body.fullname,
                    mail:req.body.email,
                    type:req.body.type,
                    password:hash
                })
                user.save(function(err){
                    if(err){
                        console.log(err);
                    }else{
                        req.session.isAuth = true;
                        res.redirect('/home');
                    }
                })
            });
            
        }  
    }else{
        if(password===cpassword){
            bcrypt.hash(password,12,function(err,hash){
                const user = new Userp({
                    name:req.body.fullname,
                    mail:req.body.email,
                    type:req.body.type,
                    password:hash
                })
                app.set("data",user.mail);
                user.save(function(err){
                    if(err){
                        console.log(err);
                    }else{
                        req.session.isAuth = true;
                        res.redirect('/main')
                    }
                })
            });
            
        }   
    }
})

app.post('/login',function(req,res){
    const username = req.body.email;
    const password = req.body.pass;
    Userp.findOne({mail:username},function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                app.set("data",foundUser.mail);
                bcrypt.compare(password,foundUser.password,function(err,result){
                    if(result === true){
                        req.session.isAuth = true;
                        res.redirect('/main')
                    }else{
                        res.render('login', {msg:"Incorrect email or password"})
                    }
                })  
            }  
        } 
    }) 
    Userd.findOne({mail:username},function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                bcrypt.compare(password,foundUser.password,function(err,result){
                    if(result === true){
                        req.session.isAuth = true;
                        res.redirect('/home');
                    }else{
                        res.render('login',{msg:"Incorrect email or password"})
                    }
                })
            } 
        }
    })
    // res.render('login', {msg:"Incorrect email or password"})
})

app.post('/post',isAuth,function(req,res){
    const disease = new Disease({
        name:req.body.fullname,
        mail:app.get('data'),
        age:req.body.age,
        gender:req.body.optionsRadios,
        bp:req.body.bp,
        description:req.body.post,
    })
    disease.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect('/recent')
        }
    });
})

app.post('/details/:topic',isAuth,function(req,res){
    const prescription = req.body.details;
    let head = _.lowerCase(req.params.topic);
    Disease.find({},function(err,foundUsers){
        if(err){
            console.log(err);
        }else{
            foundUsers.forEach(function(user){
                if(head===_.lowerCase(user.id)){
                    user.prescription = prescription
                    user.save()
                    res.redirect('/home')
                }
            })
        }
    })
})

app.listen(3000, function() {
    console.log("Server started on port 3000");
});