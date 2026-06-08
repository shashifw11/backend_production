import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}));

app.use(express.json({   /// if data comming in for of json
    limit : "16kb"
}))

app.use(express.urlencoded({  // if url comes in request
    extended : true,
    limit : "16kb"
}))

app.use(cookieParser());

// routes import 
import userRouter from "./routes/user.routes.js"


// routes declaration
// app.use("/users" , userRouter);
// http://localhost:8000/users
app.use("/api/v1/users" , userRouter);





 export {app};
