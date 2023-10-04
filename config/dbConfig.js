import dotenv from 'dotenv';

dotenv.config();

const {
  host,
  user,
  password,
  database,
  dialect,
  port,
} = process.env;

export default {
  database: {
    host,
    user,
    password,
    database,
    dialect,
    port,
  },
};
