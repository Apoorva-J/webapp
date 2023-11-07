import {createLogger,transports, format } from "winston";

const appLogger= createLogger({
    format: format.combine(format.timestamp(), format.json()),
    transports: [
        new transports.File({
            filename: "app.log",
        }),
    ],
});

export default appLogger;