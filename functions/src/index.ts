import * as firebaseAdminInstance from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/options";
import { appCheckedRequest } from "./helpers/appCheckedRequest";
import { controller } from "./modules/controller";

// ? Initialise app
if (!firebaseAdminInstance.apps.length) {
	firebaseAdminInstance.initializeApp();
}

export type AdminApp = typeof firebaseAdminInstance;

// ? Set locale
setGlobalOptions({ region: "australia-southeast1" });

// ? ? ? ? ?
// ? MAIN ?
// ? ? ? ?

export const postEnquiry = appCheckedRequest({
	firebaseAdminInstance,
	httpMethod: "POST",
	callback: controller.postEnquiryHandler,
});

export const addToMailingList = appCheckedRequest({
	firebaseAdminInstance,
	httpMethod: "POST",
	callback: controller.addToMailingListHandler,
});

export const deleteFromMailingList = appCheckedRequest({
	firebaseAdminInstance,
	httpMethod: "DELETE",
	callback: controller.deleteFromMailingListHandler,
});
