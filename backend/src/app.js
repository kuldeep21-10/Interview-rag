 import express from 'express';
 import { user } from '../models/user.model.js';
 import sessionModel from '../models/session.model.js';
 import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { auth } from '../middleware/auth.js';
import { retrieveNotes } from "./rag.js";
 import { EMAIL_REGEX,
    isValidPassword,
    normalizeEmail,bad ,isvaliduser, generateQuestions ,EvaluateAnswer,generateOverallFeedback} from './helpers.js';






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

app.post('/api/session', auth, async (req, res) => {
  try {
    const { techStack, difficulty = "medium", count = 5 } = req.body;

    if (!techStack || techStack.length === 0) {
      return res.status(400).json({ message: "techStack is required" });
    }

    // pichhle 5 sessions ke questions, taaki wahi sawal dobara na aayein
    const past = await sessionModel
      .find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("items.question")
      .lean();
    const avoid = past
      .flatMap((s) => s.items.map((i) => i.question))
      .slice(0, 30);

    const questions = await generateQuestions(techStack, difficulty, count, avoid);

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
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Could not start session" });
  }
});


app.post('/api/session/:id/complete', auth, async (req, res) => {
  try {
    const session = await sessionModel.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session already completed" });
    }

    // total score (percentage) - unanswered / failed items count as 0
    let sum = 0;
    let totalTime = 0;
    for (const item of session.items) {
      sum += typeof item.score === "number" ? item.score : 0;
      totalTime += typeof item.timeTaken === "number" ? item.timeTaken : 0;
    }
    const maxScore = session.items.length * 10;
    const totalScore = maxScore ? Math.round((sum / maxScore) * 100) : 0;

    // overall feedback from Gemini, with fallback
    let overallFeedback = "Interview completed. Review your answers below.";
    try {
      overallFeedback = await generateOverallFeedback(
        session.items,
        totalScore,
        session.difficulty
      );
    } catch (err) {
      console.error("Overall feedback failed:", err.message);
    }

    session.totalScore = totalScore;
    session.overallFeedback = overallFeedback;
    session.timeTaken = totalTime;
    session.status = "completed";
    session.completedAt = new Date();
    await session.save();

    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "could not complete session" });
  }
});

app.post('/api/session/:id/answer', auth, async (req, res) => {
  try {
    const { itemIndex, answer, timeTaken } = req.body;

    const session = await sessionModel.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session already completed" });
    }

    const item = session.items[itemIndex];
    if (!item) {
      return res.status(400).json({ message: "Invalid question index" });
    }
    if (typeof item.score === "number") {
      return res.status(400).json({ message: "Question already answered" });
    }
    if (typeof answer !== "string" || !answer.trim()) {
      return res.status(400).json({ message: "Answer is required" });
    }

    const cleanAnswer = answer.trim();
    item.answer = cleanAnswer;
    if (typeof timeTaken === "number") item.timeTaken = timeTaken;

    let evalFailed = false;
    try {
      // RAG: top 3 relevant notes (fail ho to bina notes ke evaluate hoga)
      let notes = [];
      try {
        notes = await retrieveNotes(item.question, item.topic, 3);
      } catch (err) {
        console.error("Retrieval failed:", err.message);
      }

      const result = await EvaluateAnswer(
        item.question,
        cleanAnswer,
        item.topic,
        session.difficulty,
        notes
      );
      item.score = result.score;
      item.feedback = result.feedback;
      item.strengths = result.strengths;
      item.improvements = result.improvements;
      item.usedRag = notes.length > 0;
      item.sources = notes.map((n) => ({ topic: n.topic, title: n.title }));
    } catch (err) {
      console.error("Evaluation failed:", err.message);
      evalFailed = true;
    }

    await session.save();

    if (evalFailed) {
      return res.status(502).json({
        message: "Answer saved but evaluation failed, try again",
      });
    }

    res.json({
      message: "Answer evaluated",
      score: item.score,
      feedback: item.feedback,
      strengths: item.strengths,
      improvements: item.improvements,
      sources: item.sources,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not save answer" });
  }
});

app.delete('/api/session/:id',auth,async(req,res)=>{
  try{
 
     const session = await sessionModel.findOne({
      _id : req.params.id,
      user :req.userId
     })
     if(!session){
      // return res.status(404).json({message:'Session not found'});
            
        return bad(res,"Session not found",500)


     }

     return res.status(200).json({message:'Session deleted'})

  }
  catch(error){
    res.status(500).json({message:"Unable to delete"})
  }
});

app.get('/api/session', auth, async (req, res) => {
  try {
    const sessions = await sessionModel
      .find({ user: req.userId })
      .sort({ createdAt: -1 })
      .select("techStack status totalScore completedAt");

    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not fetch sessions" });
  }
});

app.get('/api/session/:id',auth,async(req,res)=>{
 try {

  const session =  await sessionModel.findOne({
    _id : req.params.id,
    user : req.userId
  })

  if(!session){
      return bad(res,"Session not found",404)
     }
     return res.status(200).json(session);


} catch (error) {
    if (error.name === "CastError") {
      return bad(res, "Session not found", 404);
    }
    console.error(error);
    return bad(res, "Could not fetch session", 500);
  }
  
});



 export {app};