// IMPORTS
import log from "./utils/log";
import delay from './utils/delay';
import uuid from "./utils/uuid";

import express, { json } from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';

import { authenticate, login, generateToken } from "./auth";
import session from 'express-session';
import createMemoryStore from 'memorystore';
const MemoryStore = createMemoryStore(session);

// DATABSE CONNECTION
import Recipe from "./entities/recipe";
import { DataSourceSingleton } from './db';
import { DataSource } from "typeorm";
let dss: DataSourceSingleton = DataSourceSingleton.getInstance();
let db: DataSource = dss.dataSource;

// ROUTING STUFF
let router: express.Router = express.Router();

router.use(cors());
router.use(cookieParser())
router.use(session({
    secret: process.env.SESSION_SECRET || "temp_secret",
    store: new MemoryStore({
            checkPeriod: 86400000 // prune expired entries every 24h
        }),
    resave: false,
    saveUninitialized: true
    }));
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

declare module "express-session" {
    interface SessionData {
      jwt: string;
    }
  }

// start STATIC CONTENT
router.use("", express.static("public"));

//const basicAuth = require('express-basic-auth');
//router.use(basicAuth({
//    users: { admin: 'supersecret123' },
//    challenge: true // <--- needed to actually show the login dialog!
//}));

// WELCOMING REQUEST
router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    let info: string = `${req.method} ${req.originalUrl}\n\tFROM: ${req.ip} | TIME: ${new Date().toISOString()}\n\tWPID: ${process.pid}`;
    if (req.headers)
        for (const prop in req.headers)
            //if (!config.ignorable_headers.some(x => x == prop))
                info += `\n\tHEADER: ${prop}:${req.headers[prop]}`;
    if (req.query) info += "\n\tQUERY: " + JSON.stringify(req.query);
    if (req.body) info += "\n\tBODY: " + JSON.stringify(req.body);
    if (req.session) info += "\n\tSESSION: " + JSON.stringify(req.session);
    if (req.cookies) info += "\n\tCOOKIES: " + JSON.stringify(req.cookies);
    log("worker", info);
    next();
});



// BASE URL
router.get("", async (req: express.Request, res: express.Response) => {
    res.status(200).send('Benvenuti al Ricettario')
});


// LOGIN
router.post("/login", async (req: express.Request, res: express.Response) => {
    try {
        let username: string | undefined = req.body["u"]  as string | undefined;
        let password: string | undefined = req.body["p"]  as string | undefined;
        if (username && password) {
            if (await login(username, password)) {

                    let token = generateToken(username);
                    req.session.jwt = token;
             
                    res.status(200).send("OK");

            } else {
                res.status(401).send("Credenziali errate");
            }
        } else {
            res.status(401).send("Credenziali mancanti");
        }
    } catch (exc) {
        res.status(500).send("Errore generico in GET login");
    }
});

// LOGOUT
router.get("/logout", authenticate, async (req: express.Request, res: express.Response) => {
    try {
        req.session.regenerate(() => {
            res.status(200).send("OK");
        });
    } catch (exc) {
        res.status(500).send("Errore generico in GET login");
    }
});


// TEST FUNCTION
router.get("/api/test", async (req: express.Request, res: express.Response) => {
    await delay(100);
    res.status(200).send('Test Ok')
});

router.get("/api/test-auth", authenticate, async (req: express.Request, res: express.Response) => {
    await delay(100);
    res.status(200).send('Test Auth Ok')
});

// CRUD
router.post("/api/recipe", authenticate, async (req: express.Request, res: express.Response) => {
    try {
        let recipe: Recipe = new Recipe();
        recipe.title = req.body.title;
        recipe.subtitle = req.body.subtitle;
        recipe.from = req.body.from;
        recipe.ingredients = req.body.ingredients;
        recipe.method = req.body.method;
        recipe.notes = req.body.notes;
        let repo = db.getRepository(Recipe);
        recipe = await repo.save(repo.create(recipe));
        res.json(recipe);
    } catch (exc) {
        res.status(500).send("Errore generico in POST recipe");
    }
});

router.get("/api/recipe", authenticate, async (req: express.Request, res: express.Response) => {
    try {
        let query: string = "rid";
        let _id: number | undefined = req.query[query]  as number | undefined;
        let repo = db.getRepository(Recipe);
        if (_id) {
            let recipe = await repo.findOneBy({id:_id});
            if (recipe) {
                res.json(recipe);
            } else {
                res.status(404).send("Recipe id non trovato nel db");
            }
        } else {
            let recipes = await repo.find();
            res.json(recipes);
        }
    } catch (exc) {
        res.status(500).send("Errore generico in GET recipe");
    }
});

router.put("/api/recipe", authenticate, async (req: express.Request, res: express.Response) => {
    try {
        let query: string = "rid"
        let _id: number | undefined = req.query[query]  as number | undefined;
        let repo = db.getRepository(Recipe);
        if (_id) {
            let recipe = await repo.findOneBy({id:_id});
            if (recipe) {
                recipe.title = req.body.title ? req.body.title : recipe.title;
                recipe.subtitle = req.body.subtitle ? req.body.subtitle : recipe.subtitle;
                recipe.from = req.body.from ? req.body.from : recipe.from;
                recipe.ingredients = req.body.ingredients ? req.body.ingredients : recipe.ingredients;
                recipe.method = req.body.method ? req.body.method : recipe.method;
                recipe.notes = req.body.notes ? req.body.notes : recipe.notes;
                recipe = await repo.save(recipe);
                res.json(recipe);
            } else {
                res.status(404).send("Recipe id non trovato nel db");
            }
        } else {
            res.status(400).send("Recipe id mancante");
        }
    } catch (exc) {
        res.status(500).send("Errore generico in PUT recipe");
    }
});

router.delete("/api/recipe", authenticate, async (req: express.Request, res: express.Response) => {
    try {
        let query: string = "rid";
        let _id: number | undefined = req.query[query]  as number | undefined;
        let repo = db.getRepository(Recipe);
        if (_id) {
            let recipe = await repo.findOneBy({id:_id});
            if (recipe) {
                recipe = await repo.remove(recipe);
                res.json(recipe);
            } else {
                res.status(404).send("Recipe id non trovato nel db");
            }
        } else {
            res.status(400).send("Recipe id mancante");
        }
    } catch (exc) {
        res.status(500).send("Errore generico in DEL recipe");
    }
});

export default router;