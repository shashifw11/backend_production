import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB = async ()=>{
    try{
      const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
      console.log("DB Name:", connectionInstance.connection.db.databaseName);
      console.log("Host:", connectionInstance.connection.host);
      console.log(`\n MongoDB connected !! DB HOST ${connectionInstance.connection.host}`)
    }catch(err){
        console.log("MONGOOSE connection Failed" , err);
        process.exit(1);
    }
}

export default connectDB;
