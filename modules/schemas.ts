import * as z from "zod";

export const EnquiryReqBody = z.object({
	firstName: z.string(),
	lastName: z.string(),
	mobileNumber: z.string(),
	email: z.email(),
	enquiryType: z.literal(["red", "green", "blue"]),
	subject: z.string(),
	message: z.string(),
	favouriteColour: z.string().optional(),
	angerLevel: z.string().optional(),
	suggestedPunishment: z.string().optional(),
	codeName: z.string().optional(),
	levelOfSecrecy: z.number().optional(),
});
