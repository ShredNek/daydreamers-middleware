import crypto from "node:crypto";
import type { Request } from "firebase-functions/https";
import { logger } from "firebase-functions/logger";
import { StatusCodes } from "http-status-codes";
import nodemailer from "nodemailer";
import { ZodError } from "zod";
import type { FirebaseCallbackResult } from "../firebase-helpers/appCheckedRequest";
import type { AdminApp } from "../index";
import { EnquiryReqBody, PatchMailingListUserBody } from "./schemas";

type ControllerParams = {
	req: Request;
	admin: AdminApp;
};

export const controller = {
	postEnquiry: async ({ req }: ControllerParams): Promise<FirebaseCallbackResult> => {
		try {
			const { EMAIL_USER, EMAIL_PASS } = process.env;

			if (!(EMAIL_PASS && EMAIL_USER)) {
				throw new Error("EMAIL_PASS or EMAIL_USER is missing or falsy");
			}

			const transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: EMAIL_USER,
					pass: EMAIL_PASS,
				},
			});

			// ? Check that  the transporter is ready to go - this will throw an error if it fails
			await transporter.verify();

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
        ${favouriteColour ? `<p><strong>Favourite colour:</strong> ${favouriteColour}</p>` : ""}
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

			const sendMailRes = await transporter.sendMail(mailOptions);

			return {
				message: `Email sent OK. Message ID: ${sendMailRes.messageId}`,
				code: StatusCodes.OK,
			};
		} catch (error) {
			logger.error(error);
			if (error instanceof ZodError) {
				return {
					message: `There were errors parsing the request: ${JSON.stringify(
						error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(". "),
					)}`,
					code: StatusCodes.UNPROCESSABLE_ENTITY,
				};
			} else if (error instanceof Error) {
				return {
					message: `Error (${error.name}): ${error.message}`,
					code: StatusCodes.INTERNAL_SERVER_ERROR,
				};
			} else {
				return {
					message: `Unknown Error: ${JSON.stringify(error)}`,
					code: StatusCodes.INTERNAL_SERVER_ERROR,
				};
			}
		}
	},

	patchMailingListUser: async ({ req, admin }: ControllerParams): Promise<FirebaseCallbackResult> => {
		try {
			const { email, fullName } = PatchMailingListUserBody.parse(req.body);

			const db = admin.database();

			logger.info("Connected to database:", admin.app().options.databaseURL);

			const checkExistingEmailSnapshot = await db.ref("mailing_list_users").orderByChild("email").equalTo(email).get();

			if (checkExistingEmailSnapshot.exists()) {
				logger.info("User is already on mailing list");

				return {
					message: "User is already on mailing list",
					code: StatusCodes.OK,
				};
			}

			let res: null | FirebaseCallbackResult = null;

			db.ref(`mailing_list_users/${crypto.randomUUID()}`)
				.set({
					email,
					fullName,
				})
				.then(() => {
					logger.info("Database set action OK");

					res = {
						message: "User is now on mailing list - function returned OK",
						code: StatusCodes.CREATED,
					};
				})
				.catch((e) => {
					logger.error("Database set action NOT OK", e);

					res = {
						message: `Could not add user: ${JSON.stringify(JSON.stringify(e))}`,
						code: StatusCodes.BAD_REQUEST,
					};
				});

			if (res === null) {
				throw new Error("COULD NOT OBTAIN RESPONSE BACK FROM DB CALL");
			}

			return res;
		} catch (error) {
			logger.error(error);
			if (error instanceof ZodError) {
				return {
					message: `There were errors parsing the request: ${JSON.stringify(
						error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(". "),
					)}`,
					code: StatusCodes.UNPROCESSABLE_ENTITY,
				};
			} else if (error instanceof Error) {
				return {
					message: `Error (${error.name}): ${error.message}`,
					code: StatusCodes.INTERNAL_SERVER_ERROR,
				};
			} else {
				return {
					message: `Unknown Error: ${JSON.stringify(error)}`,
					code: StatusCodes.INTERNAL_SERVER_ERROR,
				};
			}
		}
	},
};
