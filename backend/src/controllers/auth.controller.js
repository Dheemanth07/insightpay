import bcrypt from 'bycrypt';
import prisma from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req, res)=>{
    try{
        const {name,email,password}=req.body;

        // 1. Check if all fields are provided
        if(!name || !email ||!password){
            return res.status(400).json({message:"All fields are required"});
        }

        // 2. Check if password is at least 6 characters long
        if(password.length<6){
            return res.status(400).json({message:"Password must be at least 6 characters long"});
        }

        // 3. Check if user already exists
        const existingUser = await prisma.user.findUnique({where:{email}});
        if(existingUser){
            return res.status(400).json({message:"User already exists"});
        }

        // 4. For new user Hash the password with 'bcrypt' and salt rounds of 10
        const hashedPassword = await bcrypt.hash(password,10);

        // 5. Create new user in the database
        const user = await prisma.user.create({
            data:{
                name,
                email,
                password:hashedPassword,
            
            },
        });

        // 6. Return success response
        return res.status(201).json({message:"User registered successfully", user});
    }catch(err){
        console.error("Error during registration:", err);
        return res.status(500).json({message:"Internal server error"});
    }
}