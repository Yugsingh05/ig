"use server";

import { SignUpSchema, SignUpValues } from "@/lib/validation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import {redirect} from "next/navigation";
export async function signup(
  credentials: SignUpValues,
): Promise<{ error: string }> {
  try {
    const { username, email, password } = SignUpSchema.parse(credentials);

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const userId = generateIdFromEntropySize(10);

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (existingUsername) {
      return {
        error: "username already exists",
      };
    }

    const existingEmail = await prisma.user.findFirst({
        where : {
            email: {
                equals: email,
                mode: "insensitive",
            }
        }
    })

    if(existingEmail){
        return {
            error: "email already exists",
        }
    }

    await prisma.user.create({
        data:{
            id: userId,
            username,
            displayName : username,
            email,
            passwordHash
        }
    })

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return redirect("/");

  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.log(error);
    return { error: "Something went wrong, Please try again" };
  }
}
