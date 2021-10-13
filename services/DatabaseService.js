import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()
const connect = () => {
  return mongoose.connect(process.env.MONGO_DATABASE_URI)
}
export const DatabaseService = { connect }
