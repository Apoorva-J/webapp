import fs from 'fs';
import path from 'path';
import db from "../config/dbSetup.js"

const currentDate = new Date();
const accountCreatedString = currentDate.toISOString();
const accountUpdatedString = currentDate.toISOString();

const getDataFromCsv=async () => {
    try {
        await db.sequelize.sync({ create: true });

        const csvData = fs.readFileSync(path.join('C:/Users/apoor/Desktop/cloud-computing/Apoorva_Jain_002737702_03/webapp/users.csv'), 'utf-8');
        const rows = csvData.split('\n').map((row) => row.split(','));

        for (let i = 1; i < rows.length; i++) {
            const [first_name, last_name, emailid, password] = rows[i];
            await db.user.create({
                first_name,
                last_name,
                emailid,
                password,
                account_created: accountCreatedString,
                account_updated: accountUpdatedString
            });
        }

        console.log('Database bootstrapped successfully.');
    } catch (error) {
        console.log('Error bootstrapping the database:');
    }
}

export default getDataFromCsv;

