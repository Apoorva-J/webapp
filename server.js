import app from './app.js'; 
import config from './config/dbConfig.js';
import logger from "./logger.js"

const port = 8080; 

const server = app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
  console.log(`Server listening on port ${port}`);   
});

export default server; 