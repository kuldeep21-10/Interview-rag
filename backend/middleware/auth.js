import jwt from 'jsonwebtoken';

const auth = (req, res , next)=>{
   try{
     const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({message:'Token is missing'});
    }

        const token = authHeader.split(" ")[1]; // ["Bearer", "<token>"]

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
         req.userId = decoded.userId;
         next();
   }
   catch(error){

            return res.status(401).json({message:'Invalid Token'});

   }
        
}

export { auth };