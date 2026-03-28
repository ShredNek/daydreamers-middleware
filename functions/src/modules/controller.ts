import dotenv from "dotenv";
import type { Context } from "hono";
import { StatusCodes } from "http-status-codes";
import nodemailer from "nodemailer";
import { ZodError } from "zod";
import { EnquiryReqBody } from "./schemas";

dotenv.config();

// const controller: (c: Context<any, unknown, {}>) => Promise<MiddlemanResponse> =
const controller = {
	postEnquiry: async (c: Context) => {
		try {
			const transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.EMAIL_USER,
					pass: process.env.EMAIL_PASS,
				},
			});

			const rawResponse = EnquiryReqBody.parse(c.req.json());

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
      ${
				suggestedPunishment
					? `suggestedPunishment: ${suggestedPunishment},`
					: ""
			}
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
        ${
					angerLevel ? `<p><strong>Anger level:</strong> ${angerLevel}</p>` : ""
				}
        ${
					suggestedPunishment
						? `<p><strong>Suggested punishment:</strong> ${suggestedPunishment}</p>`
						: ""
				}
        ${codeName ? `<p><strong>Code name:</strong> ${codeName}</p>` : ""}
        ${
					levelOfSecrecy
						? `<p><strong>Level of secrecy:</strong> ${levelOfSecrecy}</p>`
						: ""
				}`;

			const mailOptions = {
				from: email,
				to: process.env.EMAIL_USER,
				subject: `Website Enquiry: ${subject}`,
				text,
				html,
			};

			return transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					c.status(StatusCodes.INTERNAL_SERVER_ERROR);
					return c.text(JSON.stringify(error));
				}

				c.status(StatusCodes.OK);
				return c.text(`Email sent: ${info.response}`);
			});
		} catch (error) {
			if (error instanceof ZodError) {
				c.status(StatusCodes.BAD_REQUEST);
				return c.text(
					`There were errors parsing the request: ${JSON.stringify(error.issues)}`,
				);
			}

			c.status(StatusCodes.INTERNAL_SERVER_ERROR);
			c.text(`Internal Server Error: ${JSON.stringify(error)}`);
		}
	},
};

export default controller;
