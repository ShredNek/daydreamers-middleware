import { z } from "zod";

// ? This is in case someone provides a single letter for a name
// ? I might make this more strict in future but idc we just need to send some emails
const MINIMUM_FULLNAME_LENGTH = 1;

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

export const PatchMailingListUserBody = z.object({
	email: z.email(),
	fullName: z.string().min(MINIMUM_FULLNAME_LENGTH),
});
