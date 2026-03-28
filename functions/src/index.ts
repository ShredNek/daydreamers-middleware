import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { setGlobalOptions } from "firebase-functions/options";
import { onRequest } from "firebase-functions/v2/https";
import * as Http from "http-status-codes";

if (!admin.apps.length) {
	admin.initializeApp();
}

const clientProjectIdInstance = process.env.CLIENT_PROJECT_ID;

export const verifyAppCheck = async (token: string) => {
	try {
		const projectId = clientProjectIdInstance;

		if (!projectId) {
			throw new Error("CLIENT_PROJECT_ID not set");
		}

		const frontendApp =
			admin.apps.find((app) => app?.name === "client") ||
			admin.initializeApp({ projectId }, "client");

		const appCheckClaims = await admin.appCheck(frontendApp).verifyToken(token);

		return appCheckClaims;
	} catch (err) {
		console.error("App Check verification failed:", err);
		throw new Error("Unauthorized - App Check verification failed");
	}
};

// ? Set locale
setGlobalOptions({ region: "australia-southeast1" });

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const enquiry = onRequest(async (request, response) => {
	logger.info("Enquiry function received a request.", { structuredData: true });

	const appCheckToken = request.header("X-Firebase-AppCheck");

	if (!appCheckToken) {
		logger.warn("App Check token missing from request.", {
			structuredData: true,
		});
		response
			.status(Http.StatusCodes.UNAUTHORIZED)
			.send("Unauthorized: App Check token missing.");
		return;
	}

	try {
		// Verify the App Check token using the Admin SDK
		const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken);
		logger.info("App Check token verified successfully.", { appCheckClaims });

		// Your function's core logic here, now that App Check is verified
		response.send("Hello from Firebase! App Check passed.");
	} catch (error) {
		logger.error("App Check token verification failed.", { error });
		response
			.status(Http.StatusCodes.UNAUTHORIZED)
			.send("Unauthorized: App Check token invalid or expired.");
		return;
	}
});
