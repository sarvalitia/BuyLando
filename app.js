const express=require("express");
const bodyParser=require("body-parser");
const multer =require("multer");
const ejs=require("ejs");
const path=require('path');
const fs=require("fs");
const mongoose=require("mongoose");

const app=express();
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));

mongoose.connect("mongodb+srv://sarvesh200215:Chithi1977@sarveshcluster1.wnzjlpa.mongodb.net/TestDB",{useNewUrlParser: true,useUnifiedTopology: true});

const UserSchema=new mongoose.Schema({
   email:String,
   password:String,
   name:String,
   age:Number 
});

const PostSchema=new mongoose.Schema({
    filename:{
        type:String,
        unique:true,
        required:true
    },
    contentType:{
        type:String,
        required:true
    },
    imageBase64:{
        type:String,
        required:true
    },
    ProductName:String,
    About:String,
    contact:String,
    email:String,
});

const Post=mongoose.model("Post",PostSchema);

const User = mongoose.model("User",UserSchema);


var storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./public/post-images')
    },
    filename:function(req,file,cb){
        var extension=file.originalname.substring(file.originalname.lastIndexOf('.'));
        cb(null,file.fieldname+'-'+Date.now()+extension)
    }
})

const store= multer({storage:storage});


app.get("/",function(req,res){
    res.render("landing");
})

app.post("/login",function(req,res){
    User.findOne({email:req.body.email,password:req.body.password}).then((data)=>{
        if(data){
            res.redirect("/home");
        }
    })

})

app.post("/register",function(req,res){
    User.findOne({email:req.body.email}).then((result)=>{
        if(!result){
            const doc= new User({
                email:req.body.email,
                password:req.body.password,
                name:req.body.name,
                age:req.body.age
            })
            doc.save();
            res.redirect("/home");
        }
        else{
            console.log("email id Exists:");
        }
    })

   
})

app.get("/home",async(req,res)=>{
    const all_posts=await Post.find().sort({_id:-1})
    res.render("home",{posts:all_posts});
})


app.get("/upload",function(req,res){
    res.render("upload");
})

app.post("/upload",store.array('pi',12),function(req,res,next){
    console.log(req.files)
    const files=req.files;
    console.log(files);
    if(!files){
        const error=new Error("please choose right");
        error.httpsStatusCode=400;
        return next(error);          
    }

    let postArray=files.map((file)=>{
        let post=fs.readFileSync(file.path);
        return encode_image=post.toString('base64');   
    })

    let result= postArray.map((src,index)=>{
        let finalPost={
            filename:files[index].originalname,
            contentType:files[index].mimetype,
            imageBase64:src,
            ProductName:req.body.pn,
            About:req.body.abt,
            contact:req.body.pc,
            email:req.body.pe,               
        }

        let newUpload= new Post(finalPost);
        return newUpload.save().then(()=>{
            return {msg:`${files[index].originalname} uploded sucessfully`}
            })
            .catch(error=>{
            if(error){
              if(error.name==='MongoError'&&error.code===11000){
                return Promise.reject({error:`Duplicate${files[index].originalname},Filename exists`});
            
              }
              return Promise.reject({error:error.message||`Cannot Upload ${files[index].originalname}something missin}`})
            }
            })


    });
    Promise.all(result)
.then(msg=>{
  //res.json(msg);
  res.redirect("/home");
})

.catch(err=>{
  res.json(err);
  console.log(err);
})

})



app.listen(3000,function(){
    console.log("runnin on 3k ");
})