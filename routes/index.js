import Router from './route.js';  

const route = (app) => {
    app.use('/v1', Router);
}

export default route;