import type { Request } from "firebase-functions/https";
import { StatusCodes } from "http-status-codes";
import nodemailer from "nodemailer";
import { ZodError } from "zod";
import type { FirebaseCallbackResult } from "../firebase-helpers/appCheckedRequest";
import { EnquiryReqBody } from "./schemas";

const controller = {
	postEnquiry: async (req: Request): Promise<FirebaseCallbackResult> => {
		const returnedResponse: FirebaseCallbackResult = {
			message: "Unhandled exception",
			code: StatusCodes.INTERNAL_SERVER_ERROR,
		};

		try {
			const transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.EMAIL_USER,
					pass: process.env.EMAIL_PASS,
				},
			});

			const rawResponse = EnquiryReqBody.parse(req.body);

			const {
				firstName,
				lastName,
				mobileNumber,
				email,
				enquiryType,
				subject,
				message,
				favouriteColour,
				angerLevel,
				suggestedPunishment,
				codeName,
				levelOfSecrecy,
			} = rawResponse;

			const text = `Message: ${message},
      First name: ${firstName},
      Last name: ${lastName},
      Mobile number: ${mobileNumber},
      Enquiry type: ${enquiryType},
      Favourite colour: ${favouriteColour},
      ${angerLevel ? `angerLevel: ${angerLevel},` : ""}
      ${suggestedPunishment ? `suggestedPunishment: ${suggestedPunishment},` : ""}
      ${codeName ? `codeName: ${codeName},` : ""}
      ${levelOfSecrecy ? `levelOfSecrecy: ${levelOfSecrecy}` : ""}
              `;

			const html = `
      <p><strong>First name:</strong> ${firstName}</p>
      <p><strong>Last name:</strong> ${lastName}</p>
      <p><strong>Enquiry type:</strong> ${enquiryType}</p>
        <p><strong>Mobile number:</strong> ${mobileNumber}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Favourite colour:</strong> ${favouriteColour}</p>
        ${angerLevel ? `<p><strong>Anger level:</strong> ${angerLevel}</p>` : ""}
        ${suggestedPunishment ? `<p><strong>Suggested punishment:</strong> ${suggestedPunishment}</p>` : ""}
        ${codeName ? `<p><strong>Code name:</strong> ${codeName}</p>` : ""}
        ${levelOfSecrecy ? `<p><strong>Level of secrecy:</strong> ${levelOfSecrecy}</p>` : ""}`;

			const mailOptions = {
				from: email,
				to: process.env.EMAIL_USER,
				subject: `Website Enquiry: ${subject}`,
				text,
				html,
			};

			transporter.sendMail(mailOptions, (error, info) => {
				returnedResponse.message = error ? JSON.stringify(error) : `Email sent: ${info.response}`;
				returnedResponse.code = error ? StatusCodes.INTERNAL_SERVER_ERROR : StatusCodes.OK;
			});
		} catch (error) {
			if (error instanceof ZodError) {
				returnedResponse.message = `There were errors parsing the request: ${JSON.stringify(error.issues)}`;
				returnedResponse.code = StatusCodes.BAD_REQUEST;
			}

			returnedResponse.message = `Internal Server Error: ${JSON.stringify(error)}`;
			returnedResponse.code = StatusCodes.INTERNAL_SERVER_ERROR;
		}

		return returnedResponse;
	},
};

export default controller;
