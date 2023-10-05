import app from './app.js'; 
import config from './config/dbConfig.js';

const port = 8080; 

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);   
});

export default server; 