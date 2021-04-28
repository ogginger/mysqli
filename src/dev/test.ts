import * as _ from "lodash";

async function every( array: any[], callback: any ) {
    let result = true;
    for ( let index = 0; index < array.length; index++ ) {
        if (!await callback( array[index], index, array )) {
            result = false;
            break;
        }
    }
    return result;
}

class Test {
    constructor( protected tests: any[] = [] ) {}

    protected async testFunction( test: any ): Promise<boolean> {
        let testResult: boolean = undefined;
        let output: any = undefined;
        let method: any = test.function;
        if ( method == undefined ) {
            throw new Error("The function does not exist.");
        }
        if ( test.context ) {
            method = method.bind( test.context, ...test.input );
        } else {
            method = method.bind( this, ...test.input );
        }
        if ( test.exception ) {
            let exception = undefined;
            try {
                await method();
            } catch ( error ) {
                exception = error.toString? error.toString(): JSON.stringify( error );
            } finally {
                output = exception;
                test.output = test.output.toString? test.output.toString(): JSON.stringify( test.output );
                testResult = (output == test.output);
            }
        } else {
            try {
                output = await method();
                testResult = JSON.stringify( output ) == JSON.stringify( test.output );
            } catch ( error ) {
                console.log(error.toString? error.toString(): JSON.stringify( error ));
                testResult = false;
            }
        }
        if ( test.debug ) {
            console.log("Output: ", JSON.stringify( output ));
            console.log("Expected: ", JSON.stringify( test.output ));
        }

        return testResult;
    }

    

    public async evaluate() {
        let self = this;
        let tests = self.tests;
        let final: any = undefined;
        if ( tests.length == 0 ) {
            throw new Error("There are no tests to test.");
        } else {
            await every(tests, async function( test: any ) {
                let result = await self.testFunction( test );
                final = {
                    state: result,
                    message: result? "All tests passed!": "Test: " + test.name + " failed!"
                };
                return result;
            });
    
            return final;
        }
    }
}

export default async function test( tests: any ) {
    console.log("Running tests...");
    let result = await new Test( tests ).evaluate();
    console.log( result.message );
    return result.state;
}
