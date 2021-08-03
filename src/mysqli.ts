import mysql from "mysql2"
import _ from "lodash"

interface config {
    host: string,
    user: string,
    password: string
}
interface getInfo {
    database: string,
    table: string,
    id?: any,
    where?: any,
    properties?: string | string[],
    limit?: string | number
}
interface postInfo {
    database: string,
    table: string,
    properties: any
}
interface putInfo {
    database: string,
    table: string,
    id: any,
    properties: any
}
interface deleteInfo {
    database: string,
    table: string,
    id: any
}

export default class MysqlInterface {
    private server: any = undefined;

    constructor( private config: config ) {
        console.log("Mysql Interface initialized successfully!");
    }

    private async query( query: string ) {
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
            }
            
        });
    }
    public async delete({ database, table, id }: deleteInfo ): Promise<void> {
        let self = this;
        id = "where " + Object.keys( id ).map(key => { 
            return key + " = " + JSON.stringify( id[key] );
        }).join(" and ");
        let query = "delete from " + database + "." + table + " " + id + ";";
        await self.query( query );
    }
    public async put({ database, table, id, properties }: putInfo): Promise<void> {
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
    public async post({ database, table, properties }: postInfo): Promise<number> {
        let self = this;
        let keys = Object.keys( properties ).join(", ");
        let values = Object.values( properties ).map(property => { return JSON.stringify( property ); }).join(", ");
        let query = "insert into " + database + "." + table + " ( " + keys + " ) values( " + values + " );";
        let result: any = await self.query( query );
        let id = result.insertId;
        return id;
    }
    public async get({
        database,
        table,
        id,
        limit = "",
        where = "",
        properties = "*"
    }: getInfo): Promise<any> {
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