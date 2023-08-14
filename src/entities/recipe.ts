import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export default class Recipe {

    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({type: "timestamp"})
    creation: Date;
    
    @UpdateDateColumn({type: "timestamp"})
    update: Date;

    @Column()
    title: string;
    @Column()
    subtitle: string;
    @Column()
    from: string;
    @Column()
    ingredients: string;
    @Column()
    method: string;
    @Column()
    notes: string;
}
