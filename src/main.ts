import test from "./dev/test"
import MysqlInterface from "./mysqli"


function tests() {
    let context = new MysqlInterface({
        host: "localhost",
        user: "user",
        password: "password"
    });

    function test( input: any ) {
        let object: any = {
            name: "",
            input: [],
            context: context,
            function: undefined,
            output: undefined,
            debug: false    
        };
        object = Object.assign(object, input);
        return object;
    }

    return [
        test({
            name: "post_{name,color}_returnsId",
            input: [{
                database: "db",
                table: "fruits",
                properties: {
                    name: "Apple",
                    color: "Green"
                }
            }],
            function: async function( input: any ) {
                let self = this;
                await self.connect();
                let result = await MysqlInterface.prototype.post.call( this, input );
                await self.close();
                return typeof result == "number";
            },
            output: true,
            debug: false
        }),  test({
            name: "delete_id_returnsVoid",
            input: [{
                database: "db",
                table: "fruits",
                id: {
                    fruitsId: 1
                }
            }],
            function: async function( input: any ) {
                let self = this;
                let passes: boolean = true;
                await self.connect();
                let id = await self.post({
                    database: input.database,
                    table: input.table,
                    properties: {
                        name: "Apple",
                        color: "Red"
                    }
                });
                input.id.fruitsId = id;
                try {
                    await MysqlInterface.prototype.delete.call( this, input );
                } catch( error ) {
                    console.log( error.toString? error.toString(): error );
                    passes = false;
                } finally {
                    await self.close();
                    return passes;
                }
            },
            output: true,
            debug: false
        }), test({
            name: "put_{db,fruits,id,properties}_returnsVoid",
            input: [{
                database: "db",
                table: "fruits",
                id: {
                    fruitsId: undefined
                },
                properties: {
                    name: "Pear",
                    color: "Brown"
                }
            }],
            function: async function( input: any ) {
                let self = this;
                let passes: boolean = true;
                await self.connect();
                let id = await self.post({
                    database: input.database,
                    table: input.table,
                    properties: {
                        name: "Appple",
                        color: "Yellow"
                    }
                });
                input.id.fruitsId = id;
                try {
                    await MysqlInterface.prototype.put.call( this, input );
                } catch( error ) {
                    console.log( error.toString? error.toString(): error );
                    passes = false;
                } finally {
                    await self.close();
                    return passes;
                }
            },
            output: true,
            debug: false
        }), test({
            name: "get_{db,fruits}_returnsAll",
            input: [{
                database: "db",
                table: "fruits"
            }],
            function: async function( input: any ) {
                let self = this;
                await self.connect();
                let result = await MysqlInterface.prototype.get.call( this, input );
                await self.close();
                return Array.isArray( result );
            },
            output: true,
            debug: false
        }), test({
            name: "get_{db,fruits,id}_returnsRow",
            input: [{
                database: "db",
                table: "fruits",
                id: {
                    fruitsId: undefined
                }
            }],
            function: async function( input: any ) {
                let self = this;
                await self.connect();
                let id = await self.post({
                    database: input.database,
                    table: input.table,
                    properties: {
                        name: "Orange",
                        color: "Orange"
                    }
                });
                input.id.fruitsId = id;
                let result = await MysqlInterface.prototype.get.call( self, input );
                result = JSON.stringify(result);
                let expected = JSON.stringify([{
                    fruitsId: id,
                    name: "Orange",
                    color: "Orange",
                }]);
                let passes = result == expected;
                await self.delete({
                    database: "db",
                    table: "fruits",
                    id: {
                        fruitsId: id
                    }
                });
                await self.close();
                return passes;
            },
            output: true,
            debug: false
        })
    ];
}

async function main() {
    await test(tests());
}

main();