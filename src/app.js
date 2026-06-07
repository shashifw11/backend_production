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





 export {app};
