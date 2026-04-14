import type { Request } from "firebase-functions/https";
import { logger } from "firebase-functions/logger";
import { StatusCodes } from "http-status-codes";
import nodemailer from "nodemailer";
import { ZodError } from "zod";
import type { FirebaseCallbackResult } from "../helpers/appCheckedRequest";
import { buttondownRequest } from "../helpers/buttondownRequest";
import type { AdminApp } from "../index";
import { EnquiryReqBody, PatchMailingListUserBody, RemoveMailingListUserBody } from "./schemas";

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

	patchMailingListUser: async ({ req }: ControllerParams): Promise<FirebaseCallbackResult> => {
		try {
			const { email, fullName } = PatchMailingListUserBody.parse(req.body);

			const emailExists = await buttondownRequest({ endpointParam: email });

			if (emailExists.ok) {
				return {
					message: "User is already on mailing list",
					code: StatusCodes.OK,
				};
			}

			const subscribeUser = await buttondownRequest({ email, fullName, method: "POST" });

			if (subscribeUser.ok) {
				return {
					message: "User has been added to mailing list",
					code: StatusCodes.CREATED,
				};
			}

			const errorDetail = (await subscribeUser.json()) as { detail: string };

			return {
				message: errorDetail.detail,
				code: subscribeUser.status,
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

	deleteMailingListEmail: async ({ req }: ControllerParams): Promise<FirebaseCallbackResult> => {
		try {
			const { email } = RemoveMailingListUserBody.parse(req.body);

			const emailExists = await buttondownRequest({ endpointParam: email });

			if (emailExists.status === StatusCodes.NOT_FOUND) {
				return {
					message: "Email does not exist in mailing list",
					code: StatusCodes.OK,
				};
			}

			const deleteUser = await buttondownRequest({ endpointParam: email, method: "DELETE" });

			if (deleteUser.ok) {
				return {
					message: "User removed from mailing list",
					code: StatusCodes.OK,
				};
			}

			const errorDetail = (await deleteUser.json()) as { detail: string };

			return {
				message: errorDetail.detail,
				code: deleteUser.status,
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
};
