import bcrypt from "bcrypt";
import db from "../config/dbSetup.js"
import logger from "../logger.js"

export const auth = async (email, password) => {
  try {
    const user = await db.user.findOne({ where: { emailid: email } });
    logger.info('User found:', user);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return null;
    } else {
      return user.id;
    }
  } catch (error) {
    logger.error('Error during authentication:', error);
    return null;
  }
};


export const healthCheckPoint = async () => {
    try {
      await db.sequelize.authenticate();
      return true;
    } catch (error) {
      return false;
    }
  };

export const authUser = async (request, response) => {
    const header = request.headers.authorization;
    logger.info('Received authentication request with header:', header);
    console.log("header",header);

    if (!header || !header.startsWith('Basic ')) {
      logger.warn('Invalid or missing authentication header');
      return response.status(401).send('');
    }
  
    const base64Credentials = header.split(' ')[1];
    const cred = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = cred.split(':');
  
    const authCheck = await auth(email, password);
    logger.info('Authentication result:', authCheck);
    console.log("authCheck",authCheck);
    return authCheck;
  };