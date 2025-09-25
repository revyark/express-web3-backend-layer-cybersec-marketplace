import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const connectDB = async() => {
    try {
        const DB_NAME='sihdatabase';
        const connectionInscance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log(`\nMongoDB connected !! DB HOST : ${connectionInscance.connection.host}`);
    } catch (error) {
        console.log('Error connecting to the database:', error);
        process.exit(1);
    }
}

export default connectDB;
