import {Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export default class User {

    @PrimaryColumn()
    username: string;

    @CreateDateColumn({type: "timestamp"})
    creation: Date;

    @Column()
    password_hash: string;
    @Column()
    salt: string;
}
