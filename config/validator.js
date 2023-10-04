import bcrypt from "bcrypt";
import db from "../config/dbSetup.js"

export const auth = async (email, password) => {
    const user = await db.user.findOne({ where: { emailid: email } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return null;
    } else {
        return user.id;
    }
}

export const authUser = async (request, response) => {
    const header = request.headers.authorization;
    console.log("header",header);
    if (!header || !header.startsWith('Basic ')) {
      return response.status(401).send('');
    }
  
    const base64Credentials = header.split(' ')[1];
    const cred = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = cred.split(':');
  
    const authCheck = await auth(email, password);
    console.log("authCheck",authCheck);
    return authCheck;
  };