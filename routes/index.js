import Router from './route.js';  
import logger from "../logger.js"

const route = (app) => {
    app.use('/', Router);
    logger.info('Routes have been initialized.');
}

export default route;