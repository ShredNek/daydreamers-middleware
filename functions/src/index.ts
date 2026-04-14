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

export const enquiry = appCheckedRequest({
	firebaseAdminInstance,
	httpMethod: "POST",
	callback: controller.postEnquiry,
});

export const addMailingListUser = appCheckedRequest({
	firebaseAdminInstance,
	httpMethod: "PATCH",
	callback: controller.patchMailingListUser,
});

export const deleteMailingListEmail = appCheckedRequest({
	firebaseAdminInstance,
	httpMethod: "DELETE",
	callback: controller.deleteMailingListEmail,
});
