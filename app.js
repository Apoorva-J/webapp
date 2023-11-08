import express from "express";
import cors from "cors";
import route from "./routes/index.js";
import getDataFromCsv from './services/user.js';
import bodyParserErrorHandler from "express-body-parser-error-handler";

const app = express();
app.use(cors());
app.use(express.json());

route(app);
app.use(bodyParserErrorHandler());
getDataFromCsv();

export default app;