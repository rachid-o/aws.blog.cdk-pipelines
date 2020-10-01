const DEPLOY_TIME = process.env.DEPLOY_TIME!
console.info("I was deployed at: %s", DEPLOY_TIME);

export async function handler(event: any) {
    console.debug("Received event: ", event);
    return {
        statusCode: 200,
        body: "Hello from AWS Lambda, DEPLOY_TIME: " + DEPLOY_TIME
    };
}
