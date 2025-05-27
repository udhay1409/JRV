

import  {AuthOptions, DefaultUser } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import connectDb from "../utils/config/connectDB"
import { getHotelDatabase } from "@/utils/config/hotelConnection"
import User from "@/utils/model/nextauth/user.model"
import UserEmployeeSchema from "@/utils/model/UserEmployeeSchema"
import roleSchema from "@/utils/model/rolesAndPermission/roleSchema"
import mongoose from "mongoose"
import crypto from "crypto"

interface Permission {
  module: string;
  actions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  url?: string;
}
interface User extends DefaultUser {
  id: string
  name: string
  email: string
  role?: string
  permissions?:Permission[]
  isEmployee?: boolean
}

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string
    permissions?:Permission[]
    isEmployee?: boolean
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      permissions?: Permission[]
      isEmployee?: boolean
    }
  }
}


async function getModels() {
  await connectDb();
  
  // Register models with proper schemas
  const UserEmployee = mongoose.models.UserEmployee || mongoose.model("UserEmployee", UserEmployeeSchema);
  const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);
  const UserModel = mongoose.models.User || mongoose.model("User", User.schema);

  return { UserEmployee, Role, UserModel };
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("No credentials provided")
        }

        const { email, password } = credentials
        await connectDb()

        // Ensure models are registered
        const UserEmployee = mongoose.models.UserEmployee || mongoose.model("UserEmployee", UserEmployeeSchema)
        
        // First check if it's a hotel admin
        const { hotelData } = await getHotelDatabase()
        const UserModel = mongoose.models.User || mongoose.model("User", User.schema)
        
        if (email === hotelData.emailId) {
          const user = await UserModel.findOne({ email }).select("+password")

          if (!user) {
            throw new Error("You are not authorized to login. Please contact the system administrator.")
          }

          if (!user.isVerified) {
            throw new Error("Email not verified. Please verify your email before logging in.")
          }

          const isPasswordMatched = await bcrypt.compare(password, user.password)
          if (!isPasswordMatched) {
            throw new Error("Invalid email or password")
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: 'hotel admin',
            isEmployee: false
          }
        }

        // If not hotel admin, check if it's an employee
        const employee = await UserEmployee.findOne({ email })
          .select("+password")
          .populate('role');

        if (!employee) {
          throw new Error("You are not authorized to login. Please contact the system administrator.")

        }
        

        const isPasswordMatched = await bcrypt.compare(password, employee.password);
        if (!isPasswordMatched) {
          throw new Error("Invalid email or password");
        }

        // Get display name from email (everything before @)
        const displayName = email.split('@')[0]
          .split('.')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return {
          id: employee._id.toString(),
          name: displayName, // Using email-based display name
          email: employee.email,
          role: employee.role.role,
          permissions: employee.permissions,
          isEmployee: true
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        const email = user.email
        if (!email) {
          console.error("No email provided by Google")
          return false
        }

        try {
          const { hotelData } = await getHotelDatabase()
          const { UserEmployee, Role, UserModel } = await getModels();
          
          // Check if it's hotel admin
          if (email === hotelData.emailId) {
            let dbUser = await UserModel.findOne({ email: user.email })

            if (!dbUser) {
              dbUser = await UserModel.create({
                name: user.name,
                email: user.email,
                password: crypto.randomBytes(32).toString('hex'), // Random password for Google users
                isVerified: true,
                googleId: profile.sub,
                picture: (profile as { picture?: string }).picture,
                locale: (profile as { locale?: string }).locale,
                role: 'hotel admin'
              })
            } else {
              dbUser.name = user.name
              dbUser.googleId = profile.sub
              dbUser.picture = (profile as { picture?: string }).picture
              dbUser.locale = (profile as { locale?: string }).locale
              await dbUser.save()
            }

            user.id = dbUser._id.toString()
            user.role = 'hotel admin'
            user.isEmployee = false
            return true
          }

          // Check if it's an employee
          const employee = await UserEmployee.findOne({ email }).populate({
            path: 'role',
            model: Role
          });

          if (!employee) {
            return false; // Not authorized
          }

          // Update employee with Google data
          employee.googleId = profile.sub
          employee.picture = (profile as { picture?: string }).picture
          employee.locale = (profile as { locale?: string }).locale
          await employee.save()

          // Get display name from email
          const displayName = email.split('@')[0]
            .split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')

          user.id = employee._id.toString()
          user.name = displayName
          user.role = employee.role.role
          user.permissions = employee.permissions
          user.isEmployee = true

          return true
        } catch (error) {
          console.error("Error during Google sign in:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.permissions = user.permissions
        token.isEmployee = user.isEmployee
        // Add last activity timestamp
        token.lastActivity = Date.now()
      } else if (token.lastActivity) {
        // Check for inactivity
        // const INACTIVE_THRESHOLD = 2 * 60 * 60 * 1000 // 2 hours
        const INACTIVE_THRESHOLD = 5 * 60 * 60 * 1000 // 5 hours
        if (typeof token.lastActivity === 'number' && Date.now() - token.lastActivity > INACTIVE_THRESHOLD) {
          throw new Error('Session expired due to inactivity')
        }
        token.lastActivity = token.lastActivity || Date.now();        
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.permissions = token.permissions as Permission[]
        session.user.isEmployee = token.isEmployee as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // maxAge: 8 * 60 * 60, // 8 hours in seconds
    maxAge: 24 * 60 * 60, // 24 hours in seconds
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // maxAge: 8 * 60 * 60 // 8 hours in seconds
        maxAge: 24 * 60 * 60 // 24 hours in seconds
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
