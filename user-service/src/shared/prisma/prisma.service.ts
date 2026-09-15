import { Injectable , OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy, OnModuleInit {

    constructor( ){
        const adapter = new PrismaPg({
            connectionString: process.env.DATABASE_URL
        });

        super({adapter});
    }

    async onModuleInit() {
        try{
            await this.$connect();
            await this.$queryRaw `SELECT 1`;
            console.log("Database connected succesfully");
        }
        catch{
            console.log("Error in database connection");
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log("Databse disconnected successfully");
    }
}
