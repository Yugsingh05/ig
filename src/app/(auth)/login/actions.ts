"use server";

import { verify } from "@node-rs/argon2";
import prisma from "@/lib/prisma";
import { LoginSchema, LoginValues } from "@/lib/validation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { lucia } from "@/auth";
import { cookies } from "next/headers";

import { redirect } from "next/navigation";

export async function Login(
  credentials: LoginValues,
): Promise<{ error: string }> {
  try {
    const { username, password } = LoginSchema.parse(credentials);

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (!existingUsername || !existingUsername.passwordHash) {
      return {
        error: "Invalid username or password",
      };
    }

    const validPassword = await verify(existingUsername.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      return {
        error: "Invalid username or email",
      };
    }

    const session = await lucia.createSession(existingUsername.id, {});
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
