 import express from 'express';
 import { user } from '../models/user.model.js';
 import sessionModel from '../models/session.model.js';
 import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { auth } from '../middleware/auth.js';
 import { EMAIL_REGEX,
    isValidPassword,
    normalizeEmail,bad ,isvaliduser, generateQuestions } from './helpers.js';






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

app.post('/api/session',auth, async(req,res)=>{
  try{
     
      const { techStack, difficulty = "medium", count = 5 } = req.body;

    if (!techStack || techStack.length === 0) {
      return res.status(400).json({ message: "techStack is required" });
    }
     
    const questions = await generateQuestions(techStack, difficulty, count);
     const session = await sessionModel.create({
  user: req.userId,
  techStack,
  difficulty,
  items: questions.map((q) => ({
    question: q.question,
    topic: q.topic,
  })),
});
 res.status(201).json(session);
  }
  catch(error){
    console.log(error);
    
    res.status(500).json({ message: "Could not start session" });
  }
});

app.post('/api/session/:id/complete', auth ,async(req,res)=>{
try{
   const session = await sessionModel.findOne({
      _id: req.params.id,
      user: req.userId, // start route wala hi
    });
     if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session already completed" });
    }

    session.status = "completed";
    session.completedAt = new Date();
    await session.save();

  res.json(session);

}
catch(error){
  res.status(500).json({message:'could not complete session'})
}
});

app.post('/api/session/:id/answer',auth,async(req,res)=>{
  try{

    const{itemIndex, answer, timeTaken} =req.body;

     const session = await sessionModel.findOne({
      _id: req.params.id,
      user: req.userId, // start route wala hi
    });
       if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session already completed" });
    }
    if (!session.items[itemIndex]) {
      return res.status(400).json({ message: "Invalid question index" });
    }
    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: "Answer is required" });
    }
      session.items[itemIndex].answer = answer;
    session.items[itemIndex].timeTaken = timeTaken;
    await session.save();

    res.json({ message: "Answer saved" });

  }
  catch(error){
    res.status(500).json({message:"Could not save answer"})
  }
});


 export {app};