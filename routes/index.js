import Router from './route.js';  

const route = (app) => {
    app.use('/', Router);
}

export default route;