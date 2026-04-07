import type { Request } from "firebase-functions/https";
import { onRequest } from "firebase-functions/https";
import { logger } from "firebase-functions/logger";
import { StatusCodes } from "http-status-codes";
import type Methods from "methods";
import type { AdminApp } from "../index";
import GLOBALS from "../modules/globals";

const clientProjectIdInstance = process.env.CLIENT_PROJECT_ID;

const verifyAppCheck = async (token: string, firebaseAdminInstance: AdminApp) => {
	try {
		const projectId = clientProjectIdInstance;

		if (!projectId) {
			throw new Error("CLIENT_PROJECT_ID not set");
		}

		const frontendApp =
			firebaseAdminInstance.apps.find((app) => app?.name === "client") ||
			firebaseAdminInstance.initializeApp({ projectId }, "client");

		const appCheckClaims = await firebaseAdminInstance.appCheck(frontendApp).verifyToken(token);

		return appCheckClaims;
	} catch (err) {
		console.error("App Check verification failed:", err);
		throw new Error("Unauthorized - App Check verification failed");
	}
};

export type FirebaseCallbackResult = {
	message: string;
	code: StatusCodes;
};

type AppCheckedRequest = {
	firebaseAdminInstance: AdminApp;
	callback: ({ req }: { req: Request }) => Promise<FirebaseCallbackResult>;
	httpMethod: (typeof Methods)[number];
};

export const appCheckedRequest = ({ firebaseAdminInstance, callback, httpMethod }: AppCheckedRequest) =>
	onRequest(
		// ? Allows endpoint to be hit by everyone
		{ invoker: "public", cors: GLOBALS.ALLOWED_DOMAINS },
		async (request, response) => {
			// ? App check logic

			// ? 1. Check the header token exists
			const appCheckToken = request.header("X-Firebase-AppCheck");

			if (!appCheckToken) {
				logger.warn("App Check token missing from request.", {
					structuredData: true,
				});
				response.status(StatusCodes.UNAUTHORIZED).send("Unauthorized: App Check token missing.");
				return;
			}

			// ? 2. Verify that the reCAPTCHA Enterprise token is valid
			try {
				const appCheckClaims = await verifyAppCheck(appCheckToken, firebaseAdminInstance);
				logger.info("App Check token verified successfully.", {
					appCheckClaims,
				});
			} catch (error) {
				logger.error("App Check token verification failed.", { error });
				response.status(StatusCodes.UNAUTHORIZED).send("Unauthorized: App Check token invalid or expired.");
				return;
			}

			// ? 3. If the incorrect method is used, throw a not found
			if (request.method !== httpMethod) {
				response.status(StatusCodes.NOT_FOUND).send("Method not found");
				return;
			}

			// ? 4. Execute main logic here
			try {
				const res = await callback({ req: request });
				response.status(res.code).send(res.message);
			} catch (error) {
				response
					.status(StatusCodes.INTERNAL_SERVER_ERROR)
					.send(error instanceof Error ? error.message : "Unknown exception");
			}

			return;
		},
	);
