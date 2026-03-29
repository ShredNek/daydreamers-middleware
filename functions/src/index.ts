import admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/options";
import { StatusCodes } from "http-status-codes";
import { appCheckedRequest } from "./firebase-helpers/appCheckedRequest";
import controller from "./modules/controller";

// ? Initialise app
if (!admin.apps.length) {
	admin.initializeApp();
}

export type AdminApp = typeof admin;

// ? Set locale
setGlobalOptions({ region: "australia-southeast1" });

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// ? ? ? ? ?
// ? MAIN ?
// ? ? ? ?

export const enquiryGet = appCheckedRequest({
	firebaseAdminInstance: admin,
	httpMethod: "GET",
	callback: async () => {
		return {
			message: "Test successful - middleware checks passed",
			code: StatusCodes.ACCEPTED,
		};
	},
});

export const enquiryPost = appCheckedRequest({
	firebaseAdminInstance: admin,
	httpMethod: "POST",
	callback: async (req) => controller.postEnquiry(req),
});
