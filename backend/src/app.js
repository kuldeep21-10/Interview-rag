 import express from 'express';
 import { user } from '../models/user.model.js';
 import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { auth } from '../middleware/auth.js';
 import { EMAIL_REGEX,
    isValidPassword,
    normalizeEmail,bad ,isvaliduser } from './helpers.js';






 const app = express();


 app.use(express.json({ limit: "100kb" }));




 app.post('/signup' ,async(req , res ) => {
 try{
       const email = normalizeEmail(req.body?.email);
    const username = req.body?.username;
    const password = req.body?.password;


    if (!email) return bad(res, "email is required");
    if(!password) return bad(res, "password is required");
    if(!username ) return bad(res, "username  is required");
    if (!EMAIL_REGEX.test(email)) return bad(res, "enter a valid email");


    if(!isValidPassword(password)) return bad(res, "Enter a valid password");
    if(!isvaliduser(username)) return bad(res, "invalid username" );
    if (await user.findOne({ email })) return bad(res, "user already exists");


     const hashedPassword = await bcrypt.hash(password, 10);

     const newUser = await user.create({username, email,password : hashedPassword})

     return res.status(201).json({
      message: "user created",
      user: { id: newUser._id, email: newUser.email },
    });

 }
 catch(error){
   
     if (error?.code === 11000) return bad(res, "user already exists"); // unique index race
    return res.status(500).json({message:"Server error"})

 }

});

app.post('/login' ,async(req, res )=>{
    try{

       const email = normalizeEmail(req.body?.email); 
       const password = req.body?.password; 
        
       if(!password)  return bad(res,"invalid password");
       if (!EMAIL_REGEX.test(email)) return bad(res, "enter a valid email");

       const User  = await user.findOne({email});


        const match = User ? await bcrypt.compare(password, User.password) : false;

        if(!User || !match){
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        
            const token = jwt.sign({ userId: User._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        return res.status(200).json({
            success : true,
            token,
            message:" login successful"
        })
         

    }
    catch(error){
       return res.status(500).json({ message:"Server error"})
    }
})


app.get("/me", auth, async (req, res) => {
  try {
    const foundUser = await user.findById(req.userId).select("-password");

    if (!foundUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user: foundUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


 export {app};