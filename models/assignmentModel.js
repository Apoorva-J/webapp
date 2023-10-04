import { DataTypes } from "sequelize";

const assignmentModel = (sequelize) => {
    let Assignment = sequelize.define('assignment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
        },
        name: {
            type: DataTypes.STRING,
        },
        points: {
            type: DataTypes.INTEGER,
            validate: {
                min: 1,
                max: 10,
            },
        },
        num_of_attempts: {
            type: DataTypes.INTEGER,
            validate: {
                min: 1,
                max: 100,
            },
        },
        deadline: {
            type: DataTypes.STRING,
        },
        assignment_created: {
            type: DataTypes.STRING,
        },
        assignment_updated: {
            type: DataTypes.STRING,
        }
    },
        {
            timestamps: false,
        });
    return Assignment;
}

export default assignmentModel;