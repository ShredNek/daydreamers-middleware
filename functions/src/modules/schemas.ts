import { z } from "zod";

// 1. Define the options in a constant array (Zod needs the runtime values)
const ENQUIRY_TYPES = [
	"General",
	"Booking",
	"Management",
	"Scathing Review",
	"Content or Merch Request",
	"Divulge Covert Information",
] as const;

export const EnquiryReqBody = z.object({
	firstName: z.string(),
	lastName: z.string(),
	mobileNumber: z.string(),
	email: z.email(),
	enquiryType: z.enum(ENQUIRY_TYPES),
	subject: z.string(),
	message: z.string(),
	favouriteColour: z.string().nullable(),
	angerLevel: z.string().nullable(),
	suggestedPunishment: z.string().nullable(),
	codeName: z.string().nullable(),
	levelOfSecrecy: z.number().nullable(),
});
