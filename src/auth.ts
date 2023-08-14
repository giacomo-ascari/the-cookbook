import express from "express";

import { sha512 } from 'sha512-crypt-ts';

import jwt, { Secret, JwtPayload } from 'jsonwebtoken';

import User from "./entities/user";
import { DataSourceSingleton } from './db';
import { DataSource } from "typeorm";

let dss: DataSourceSingleton = DataSourceSingleton.getInstance();
let db: DataSource = dss.dataSource;


function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  
  try {
    const token = jwt.verify(req.session.jwt || "", process.env.JWT_SECRET || "temp_secret");
    console.log(token)
    next();
  } catch {
    res.status(401);
    res.send('Access forbidden');
  }
}

function generateToken(username: string) {

  const token = jwt.sign({ user: username }, process.env.JWT_SECRET || "temp_secret", {
    expiresIn: '28 days',
  });

  return token;

}

async function login(username: string, password: string) {
  let repo = db.getRepository(User);
  let user = await repo.findOneBy({username:username});
  if (user) {
    let salt: string = user.salt;
    if (user.password_hash == sha512.hex(password + salt)) {
      // ok
      return true;
    } else {
      // password errata
      return false;
    }

  } else {
    // username inesistente
    return false;
  }
}

export { authenticate, login, generateToken };