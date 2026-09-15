import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit , OnModuleDestroy {
   
    constructor(){
        const adapter = new PrismaPg({
            connectionString: process.env.DATABASE_URL
        });

        super({adapter});

    }
    async onModuleInit() {
        try{
            await this.$connect();
            await this.$queryRaw `SELECT 1`;
            console.log("database connected successfulyy");
        }
        catch(err){
            console.log("error:", err);
        }

    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log("Database disconnected successfully");
    }



}
