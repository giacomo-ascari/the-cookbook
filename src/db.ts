import "reflect-metadata";
import { DataSource } from "typeorm";
import Recipe from "./entities/recipe";
import User from "./entities/user";

//https://www.npmjs.com/package//typeorm

class DataSourceSingleton {

    private static instance: DataSourceSingleton;

    public dataSource: DataSource;

    public constructor() {
        this.dataSource = new DataSource({
            type: "postgres",
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || "5432"),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            entities: [Recipe, User],
            synchronize: true,
            logging: false,
        })
    }

    public static getInstance(): DataSourceSingleton {
        if (!DataSourceSingleton.instance) {
            DataSourceSingleton.instance = new DataSourceSingleton();
        }
        return DataSourceSingleton.instance;
    }
}

export { DataSourceSingleton };