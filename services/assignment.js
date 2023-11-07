import db from "../config/dbSetup.js";
import logger from "../logger.js"

//add a new assignment
export const addAssignment = async (newDetails) => {
    try {
        await db.sequelize.sync({ alter: true });
        const assignment = await db.assignment.create(newDetails);
        logger.info('Assignment created:', assignment);
        return assignment;
    } catch (error) {
        logger.error('Error creating assignment:', error);
        console.error("Error creating assignment:");
        throw error; 
    }
}

// delete a assignment with logging
export const removeAssignment = async (id) => {
    try {
      const result = await db.assignment.destroy({
        where: { id },
      });
      logger.info('Assignment removed:', result);
      return result;
    } catch (error) {
      logger.error('Error removing assignment:', error);
      throw error;
    }
  }

//get all athe assignments
export const getAllAssignments = async () => {
    try {
      const assignments = await db.assignment.findAll();
      logger.info('Retrieved all assignments:', assignments);
      return assignments;
    } catch (error) {
      logger.error('Error retrieving all assignments:', error);
      return null;
    }
  }

//get all athe assignments
export const getAssignmentById = async (id) => {
    try {
      const assignment = await db.assignment.findOne({
        where: { id: id },
      });
      if (assignment) {
        logger.info('Retrieved assignment by ID:', assignment);
      } else {
        logger.info('No assignment found with ID:', id);
      }
      return assignment;
    } catch (error) {
      logger.error('Error retrieving assignment by ID:', error);
      throw error;
    }
  }

//update the assignments
export const updateAssignment = async (updatedDetails, id) => {
    const { name, points, num_of_attempts, deadline, assignment_updated } = updatedDetails;
    try {
      const result = await db.assignment.update(
        { name, points, num_of_attempts, deadline, assignment_updated },
        { where: { id: id } }
      );
      if (result[0] === 1) {
        logger.info('Assignment updated successfully');
      } else {
        logger.info('No assignment found with ID:', id);
      }
      return result;
    } catch (error) {
      logger.error('Error updating assignment:', error);
      throw error;
    }
  }

//health check
export const healthCheck = async () => {
    try {
      await db.sequelize.authenticate();
      logger.info('Health check succeeded');
      return true;
    } catch (error) {
      logger.error('Health check failed:', error);
      return false;
    }
  }