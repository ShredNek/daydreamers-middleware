import type Methods from "methods";

type ButtondownRequest = {
	email?: string;
	endpointParam?: string;
	fullName?: string;
	method?: (typeof Methods)[number];
};

export const buttondownRequest = async ({ endpointParam, email, fullName, method }: ButtondownRequest) => {
	const { BUTTONDOWN_ENDPOINT, BUTTONDOWN_API_KEY } = process.env;

	if (!(BUTTONDOWN_API_KEY && BUTTONDOWN_ENDPOINT)) {
		throw Error("Buttondown API Key or Endpoint is falsy");
	}

	return await fetch(`${BUTTONDOWN_ENDPOINT}${endpointParam ? `/${endpointParam}` : ""}`, {
		headers: {
			Authorization: `Token ${BUTTONDOWN_API_KEY}`,
			// ! "X-Buttondown-Bypass-Firewall": "true", ! Let's try not to use this as you can only send 5 requests AN HOUR with this
		},
		method,
		body:
			// ? Only provide a body if BOTH email and fullName is provided
			email && fullName
				? JSON.stringify({
						email_address: email,
						metadata: { name: fullName },
						type: "regular",
						tags: ["website"],
					})
				: undefined,
	});
};
