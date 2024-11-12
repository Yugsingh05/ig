import {z} from "zod";

const requiredString = z.string().trim().min(1,"Required");

export const SignUpSchema = z.object({
    email : requiredString.email("Invalid email address"),
    username: requiredString.regex(
        /^[a-zA-Z0-9_-]+$/,
        "Only letters, numbers, - and _ allowed",
      ),
      password : requiredString.min(8,"Must be at least 8 characters"),
});

export type SignUpValues = z.infer<typeof SignUpSchema>;

export const LoginSchema = z.object({
    username : requiredString,
    password : requiredString,
})

export type LoginValues = z.infer<typeof LoginSchema>;