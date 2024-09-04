import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = `${process.env.MONGODB_URI}`;

        const connectionInstance = await mongoose.connect(uri);
        console.log(
            `MongoDB connected! DB Host: ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.log("MongoDB connection FAILED", error);
        process.exit(1);
    }
};

export default connectDB;
