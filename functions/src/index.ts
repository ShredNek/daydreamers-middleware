import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/options";
import { appCheckedRequest } from "./firebase-helpers/appCheckedRequest";
import * as Http from "http-status-codes";

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

export const enquiry = await appCheckedRequest({
	firebaseAdminInstance: admin,
	httpMethod: "GET",
	callback: async () => {
		return {
			message: "Test successful - middleware checks passed",
			code: Http.StatusCodes.ACCEPTED,
		};
	},
});
