import mysql from "mysql2"
import _ from "lodash"

export interface MysqlConfig {
    host: string,
    user: string,
    password: string
}
export interface GetInfo {
    database: string,
    table: string,
    id?: any,
    where?: any,
    properties?: string | string[],
    limit?: string | number
}
export interface PostInfo {
    database: string,
    table: string,
    properties: any
}
export interface PutInfo {
    database: string,
    table: string,
    id: any,
    properties: any
}
export interface DeleteInfo {
    database: string,
    table: string,
    id: any
}

export default class MysqlInterface {
    private server: any = undefined;

    constructor( private config: MysqlConfig, private debug: boolean = false ) {
        if ( debug ) { console.log("Mysql Interface initialized successfully!"); }
    }

    public async query( query: string ) {
        let self = this;
        return new Promise(function( resolve, reject ) {
            self.server.query(query, function( error: any, result: any, fields: any ) {
                if ( error ) {
                    reject( error );
                } else {
                    resolve( result );
                }
            });
        });
    }
    public async connect(): Promise<void> {
        let self = this;
        return new Promise(function( resolve, reject ) {
            self.server = mysql.createConnection( self.config );
            self.server.connect(function( error: any ) {
                if ( error ) {
                    reject( error );
                } else {
                    resolve();
                }
            });
        });
    }
    public async close(): Promise<void> {
        let self = this;
        return new Promise(function( resolve, reject ) {
            if ( self.server && self.server.state != "disconnected" ) {
                self.server.end(function( error: any ) {
                    if ( error ) {
                        reject( error );
                    } else {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
    public async delete({ database, table, id }: DeleteInfo ): Promise<void> {
        let self = this;
        id = "where " + Object.keys( id ).map(key => { 
            return key + " = " + JSON.stringify( id[key] );
        }).join(" and ");
        let query = "delete from " + database + "." + table + " " + id + ";";
        await self.query( query );
    }
    public async put({ database, table, id, properties }: PutInfo): Promise<void> {
        let self = this;
        properties = Object.keys( properties ).map(key => {
            return key + " = " + JSON.stringify( properties[key] );
        }).join(", ");
        id = Object.keys( id ).map(key => { 
            return key + " = " + JSON.stringify( id[key] );
        }).join(" and ");
        let query = "update " + database + "." + table + " set " + properties + " where " + id + ";";
        await self.query( query );
    }
    public async post({ database, table, properties }: PostInfo): Promise<number> {
        let self = this;
        let keys = Object.keys( properties ).join(", ");
        let values = Object.values( properties ).map(property => { return JSON.stringify( property ); }).join(", ");
        let query = "insert into " + database + "." + table + " ( " + keys + " ) values( " + values + " );";
        let result: any = await self.query( query );
        let id = result?.insertId;
        return id;
    }
    public async get({
        database,
        table,
        id,
        limit = "",
        where = "",
        properties = "*"
    }: GetInfo): Promise<any> {
        let self = this;
        if (
            _.isEmpty( id ) == false && 
            _.isEmpty( where ) == false
        ) {
            throw new Error("The id and where clause were both set.");
        } else {
            properties = Array.isArray( properties )? properties.join(", "): properties;
            if ( 
                id &&
                _.isEmpty( id ) == false
            ) {
                where = "where " + Object.keys( id ).map(key => { 
                    return key + " = " + JSON.stringify( id[key] );
                }).join(" and ");
            } else if ( 
                where && 
                _.isEmpty( where ) == false
            ) {
                where = (typeof where == "string")? where: Object.keys( where ).map(key => {
                    return key + " = " + JSON.stringify( where[key] );
                }).join(" and ");
                where = where.match(/^where /i)? where: "where " + where;
            } else {
                where = "";
            }
            if ( limit ) {
                limit = (typeof limit == "string")? limit: "limit " + limit.toString();
                limit = limit.match(/^limit /i)? limit: "limit " + limit;
            }
            
            let query = "select " + properties + " from " + database + "." + table + " " + where + " " + limit;
            query = query.trim() + ";";
            let result = await self.query( query );
            return result;
        }
    }
}

export function tests( config: MysqlConfig ): any[] {
    return [{
        name: "post_{name,color}_returnsId",
        context: function() {
            return new class Mock extends MysqlInterface {
                public result: string = "";
                public async query( query: string ) {
                    this.result = query;
                }
            }( config );
        },
        input: [{
            database: "db",
            table: "fruits",
            properties: {
                name: "Apple",
                color: "Green"
            }
        }],
        function: MysqlInterface.prototype.post,
        expected: "insert into db.fruits ( name, color ) values( \"Apple\", \"Green\" );",
        output: function() {
            let mock: any = this;
            return mock.result;
        },
        debug: false,
        run: true
    }, {
        name: "delete_id_returnsVoid",
        context: function() {
            return new class mock extends MysqlInterface {
                public result: string = "";
                public async query( query: string ) {
                    this.result = query;
                }
            }( config );
        },
        input: [{
            database: "db",
            table: "fruits",
            id: {
                fruitsId: 1
            }
        }],
        function: MysqlInterface.prototype.delete,
        expected: "delete from db.fruits where fruitsId = 1;",
        output: function() {
            let mock: any = this;
            return mock.result;
        },
        debug: false,
        run: true
    }, {
        name: "put_{db,fruits,id,properties}_returnsVoid",
        context: function() {
            return new class mock extends MysqlInterface {
                public result: string = "";
                public async query( query: string ) {
                    this.result = query;
                }
            }( config );
        },
        input: [{
            database: "db",
            table: "fruits",
            id: {
                fruitsId: 1
            },
            properties: {
                name: "Pear",
                color: "Brown"
            }
        }],
        function: MysqlInterface.prototype.put,
        expected: "update db.fruits set name = \"Pear\", color = \"Brown\" where fruitsId = 1;",
        output: function() {
            let mock: any = this;
            return mock.result;
        },
        debug: false,
        run: true
    }, {
        name: "get_{db,fruits}_returnsAll",
        context: function() {
            return new class mock extends MysqlInterface {
                public result = "";
                public async query( query: string ) {
                    this.result = query;
                }
            }( config );
        },
        input: [{
            database: "db",
            table: "fruits"
        }],
        function: MysqlInterface.prototype.get,
        expected: "select * from db.fruits;",
        output: function() {
            let mock: any = this;
            return mock.result;
        },
        debug: false,
        run: true
    }, {
        name: "get_{db,fruits,id}_returnsRow",
        context: function() {
            return new class mock extends MysqlInterface {
                public result = "";
                public async query( query: string ) {
                    this.result = query;
                }
            }( config );
        },
        input: [{
            database: "db",
            table: "fruits",
            id: {
                fruitsId: 1
            }
        }],
        function: MysqlInterface.prototype.get,
        expected: "select * from db.fruits where fruitsId = 1;",
        output: function() {
            let mock: any = this;
            return mock.result;
        },
        debug: false,
        run: true
    }, {
        name: "get_{db,fruits,emptyWhereObject}_returnsAll",
        context: function() {
            return new MysqlInterface( config );
        },
        input: [{
            database: "db",
            table: "fruits"
        }],
        function: async function( input: any ) {
            let self = this;
            await self.connect();
            let all = await self.get({
                database: input.database,
                table: input.table
            });
            let result = await MysqlInterface.prototype.get.call( self, input );
            result = JSON.stringify(result);
            let expected = JSON.stringify(all);
            let passes = result == expected;
            await self.close();
            return passes;
        },
        output: true,
        debug: false,
        run: false
    }];
}