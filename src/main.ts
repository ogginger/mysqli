import test from "@ogginger/testsuite"
import * as mysqli from "./mysqli"

async function main() {
    await test(mysqli.tests({
        host: "localhost",
        user: "user",
        password: "password"
    }));
}

main().catch(console.error);