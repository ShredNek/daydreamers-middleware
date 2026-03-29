import * as Http from "http-status-codes";
import * as logger from "firebase-functions/logger";
import type { AdminApp } from "../index";
import { onRequest } from "firebase-functions/https";
import GLOBALS from "../modules/globals";

const clientProjectIdInstance = process.env.CLIENT_PROJECT_ID;

type SupportedMethods = "GET" | "POST" | "DELETE";

const verifyAppCheck = async (
	token: string,
	firebaseAdminInstance: AdminApp,
) => {
	try {
		const projectId = clientProjectIdInstance;

		if (!projectId) {
			throw new Error("CLIENT_PROJECT_ID not set");
		}

		const frontendApp =
			firebaseAdminInstance.apps.find((app) => app?.name === "client") ||
			firebaseAdminInstance.initializeApp({ projectId }, "client");

		const appCheckClaims = await firebaseAdminInstance
			.appCheck(frontendApp)
			.verifyToken(token);

		return appCheckClaims;
	} catch (err) {
		console.error("App Check verification failed:", err);
		throw new Error("Unauthorized - App Check verification failed");
	}
};

type FirebaseCallbackResult = {
	message: string;
	code: Http.StatusCodes;
};

type AppCheckedRequest = {
	firebaseAdminInstance: AdminApp;
	callback: () => Promise<FirebaseCallbackResult>;
	httpMethod: SupportedMethods;
};

export const appCheckedRequest = async ({
	firebaseAdminInstance,
	callback,
	httpMethod,
}: AppCheckedRequest) =>
	onRequest(
		// ? Allows endpoint to be hit by everyone, and disables
		{ invoker: "public", cors: GLOBALS.ALLOWED_DOMAINS },
		async (request, response) => {
			// ? App check logic

			// ? 1. Check the header token exists
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

			// ? 2. Verify that the reCAPTCHA Enterprise token is valid
			try {
				const appCheckClaims = await verifyAppCheck(
					appCheckToken,
					firebaseAdminInstance,
				);
				logger.info("App Check token verified successfully.", {
					appCheckClaims,
				});
			} catch (error) {
				logger.error("App Check token verification failed.", { error });
				response
					.status(Http.StatusCodes.UNAUTHORIZED)
					.send("Unauthorized: App Check token invalid or expired.");
				return;
			}

			// ? 3. If the incorrect method is used, throw a not found
			if (request.method !== httpMethod) {
				response.status(Http.StatusCodes.NOT_FOUND).send("Method not found");
				return;
			}

			try {
				const res = await callback();
				response.status(res.code).send(res.message);
			} catch (error) {
				response
					.status(Http.StatusCodes.INTERNAL_SERVER_ERROR)
					.send(error instanceof Error ? error.message : "Unknown exception");
			}

			return;
		},
	);
