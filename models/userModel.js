import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";

const userModel = (sequelize) => {
    (async () => {
        try {
          await userModel.sync({ alter: true });
          console.log('User table synced or altered successfully.');
        } catch (error) {
          console.error('Error syncing or altering User table:', error);
        }
    })();
    let User = sequelize.define("user", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        emailid: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        account_created: {
            type: DataTypes.STRING,
            allowNull: false
        },
        account_updated: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
        {
            timestamps: false,
        });
        
    User.beforeCreate((user) => {
        if(user.password) {
            user.password = bcrypt.hashSync(user.password, 12);
        }
    });
    return User;
}

export default userModel;
