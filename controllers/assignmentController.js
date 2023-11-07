import {
  addAssignment,
  removeAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  healthCheck,
} from "../services/assignment.js";
import db from "../config/dbSetup.js";
import { authUser } from "../config/validator.js";
import logger from "../logger.js"

const health = await healthCheck();

// Create assignment
export const post = async (request, response) => {
  try {
    if (health !== true) {
      logger.error('Health check failed. Unable to create assignment.');
      return response
        .status(503)
        .header("Cache-Control", "no-cache, no-store, must-revalidate")
        .send("");
    }

    const authenticated = await authUser(request, response);

    if (authenticated === null) {
      logger.warn('Authentication failed. Unable to create assignment.');
      return response.status(401).send("");
    }

    const bodyKeys = Object.keys(request.body);
    const requiredKeys = ["name", "points", "num_of_attempts", "deadline"];
    const optionalKeys = ["assignment_created", "assignment_updated"];

    // Check if all required keys are present
    const missingKeys = requiredKeys.filter((key) => !bodyKeys.includes(key));

    if (missingKeys.length > 0) {
      logger.warn('Missing required keys in the payload:', missingKeys.join(", "));
      return response
        .status(400)
        .send("Missing required keys: " + missingKeys.join(", "));
    }

    // Check if there are any additional keys in the payload
    const extraKeys = bodyKeys.filter(
      (key) => !requiredKeys.includes(key) && !optionalKeys.includes(key)
    );

    if (extraKeys.length > 0) {
      logger.warn('Invalid keys in the payload:', extraKeys.join(", "));
      return response
        .status(400)
        .send("Invalid keys in the payload: " + extraKeys.join(", "));
    }

    try {
      const newDetails = {
        ...request.body,
        user_id: authenticated,
        assignment_created: new Date().toISOString(),
        assignment_updated: new Date().toISOString(),
      };
      await addAssignment(newDetails);
      logger.info('Assignment has been successfully created.');
      return response.status(201).send("");
    } catch (error) {
      logger.error('Error creating assignment:', error);
      return response.status(400).send("");
    }
  } catch {
    logger.error('Syntax error in the request');
    return response.status(400).json({ error: "Syntax error" }).send();
  }
};

// Get all assignments
export const getAssignments = async (request, response) => {
  if (health !== true) {
    logger.error('Health check failed. Unable to retrieve all assignments.');
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);

  if (authenticated === null) {
    logger.warn('Authentication failed. Unable to retrieve all assignments.');
    return response.status(401).send("");
  }

  try {
    const assignments = await getAllAssignments();

    if (request.body && Object.keys(request.body).length > 0) {
      logger.warn('Invalid request body. Unable to retrieve all assignments.');
      return response.status(400).send();
    } else {
      logger.info('All assignments have been successfully retrieved.');
      return response.status(200).send(assignments);
    }
  } catch (error) {
    logger.error('Error retrieving all assignments:', error);
    return response.status(400).send("");
  }
};

// Get assignment by Id
export const getAssignmentUsingId = async (request, response) => {
  if (health !== true) {
    logger.error('Health check failed. Unable to retrieve assignment by ID.');
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);
  if (authenticated === null) {
    logger.warn('Authentication failed. Unable to retrieve assignment by ID.');
    return response.status(401).send("");
  }

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });
  
  if (!assignment) {
    logger.warn(`Assignment with ID ${request.params.id} not found. Unable to retrieve assignment by ID.`);
    return response.status(204).send(""); 
  }

  try {
    const id = request.params.id;
    const assignments = await getAssignmentById(id);

    if (request.body && Object.keys(request.body).length > 0) {
      logger.warn('Invalid request body. Unable to retrieve assignment by ID.');
      return response.status(400).send();
    } else {
      logger.info(`Assignment with ID ${id} has been successfully retrieved.`);
      return response.status(200).send(assignments);
    }
  } catch (error) {
    logger.error('Error retrieving assignment by ID:', error);
    return response.status(400).send("");
  }
};

// Update assignment
export const updatedAssignment = async (request, response) => {
  if (health !== true) {
    logger.error('Health check failed. Unable to update assignment.');
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);
  if (authenticated === null) {
    logger.warn('Authentication failed. Unable to update assignment.');
    return response.status(401).send("");
  }

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });

  if (!assignment) {
    logger.warn(`Assignment with ID ${request.params.id} not found. Unable to update assignment.`);
    return response.status(404).send("");
  }

  if (assignment.user_id !== authenticated) {
    logger.warn(`Permission denied. User ${authenticated} does not have access to update assignment with ID ${request.params.id}.`);
    return response.status(403).send("");
  }

  const bodyKeys = Object.keys(request.body);

  const requiredKeys = ["name", "points", "num_of_attempts", "deadline"];

  const optionalKeys = ["assignment_created", "assignment_updated"];

  // Check if all required keys are present
  const missingKeys = requiredKeys.filter((key) => !bodyKeys.includes(key));

  if (missingKeys.length > 0) {
    logger.warn('Missing required keys in the payload:', missingKeys.join(", "));
    return response
      .status(400)
      .send("Missing required keys: " + missingKeys.join(", "));
  }

  // Check if there are any additional keys in the payload
  const extraKeys = bodyKeys.filter(
    (key) => !requiredKeys.includes(key) && !optionalKeys.includes(key)
  );

  if (extraKeys.length > 0) {
    logger.warn('Invalid keys in the payload:', extraKeys.join(", "));
    return response
      .status(400)
      .send("Invalid keys in the payload: " + extraKeys.join(", "));
  }

  try {
    const id = request.params.id;
    const newDetails = {
      ...request.body,
      assignment_updated: new Date().toISOString(),
    };
    await updateAssignment(newDetails, id);
    logger.info(`Assignment with ID ${id} has been successfully updated.`);
    return response.status(204).send("");
  } catch (error) {
    logger.error('Error updating assignment:', error);
    console.log("db error");
    return response.status(400).send("");
  }
};

// Remove assignment
export const remove = async (request, response) => {
  if (health !== true) {
    logger.error('Health check failed. Unable to remove assignment.');
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);

  if (authenticated === null) {
    logger.warn('Authentication failed. Unable to remove assignment.');
    return response.status(401).send("");
  }

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });

  if (!assignment) {
    logger.warn(`Assignment with ID ${request.params.id} not found. Unable to remove assignment.`);
    return response.status(404).send("");
  }

  if (assignment.user_id !== authenticated) {
    logger.warn(`Permission denied. User ${authenticated} does not have access to remove assignment with ID ${request.params.id}.`);
    return response.status(403).send("");
  }

  if (request.body && Object.keys(request.body).length > 0) {
    logger.warn('Invalid request body. Unable to remove assignment.');
    return response.status(400).send("");
  }

  try {
    const id = request.params.id;
    await removeAssignment(id);
    logger.info(`Assignment with ID ${id} has been successfully removed.`);
    return response.status(204).send("");
  } catch (error) {
    logger.error('Error removing assignment:', error);
    console.log("db error");
    return response.status(400).send("");
  }
};

// Health check for assignment
export const healthz = async (request, response) => {
  if (
    request.method !== "GET" ||
    request.headers["content-length"] > 0 ||
    Object.keys(request.query).length > 0
  ) {
    return response.status(400).send("");
  }

  try {
    const health = await healthCheck();
    const status = health ? 200 : 503;

      // Log health check status
      if (health) {
        logger.info('Health check succeeded');
      } else {
        logger.error('Health check failed');
      }

    return response
      .status(status)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  } catch (error) {
    logger.error('Error during health check:', error);

    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }
};
