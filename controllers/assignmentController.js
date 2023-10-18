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

const health = await healthCheck();

// Create assignment
export const post = async (request, response) => {
  try {
    if (health !== true) {
      return response
        .status(503)
        .header("Cache-Control", "no-cache, no-store, must-revalidate")
        .send("");
    }

    const authenticated = await authUser(request, response);

    if (authenticated === null) {
      return response.status(401).send("");
    }

    const bodyKeys = Object.keys(request.body);
    const requiredKeys = ["name", "points", "num_of_attempts", "deadline"];
    const optionalKeys = ["assignment_created", "assignment_updated"];

    // Check if all required keys are present
    const missingKeys = requiredKeys.filter((key) => !bodyKeys.includes(key));

    if (missingKeys.length > 0) {
      return response
        .status(400)
        .send("Missing required keys: " + missingKeys.join(", "));
    }

    // Check if there are any additional keys in the payload
    const extraKeys = bodyKeys.filter(
      (key) => !requiredKeys.includes(key) && !optionalKeys.includes(key)
    );

    if (extraKeys.length > 0) {
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
      return response.status(201).send("");
    } catch (error) {
      console.log("error" + error);
      return response.status(400).send("");
    }
  } catch {
    return response.status(400).json({error:"Syntax error"}).send();
  }
};

// Get all assignments
export const getAssignments = async (request, response) => {
  if (health !== true) {
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);

  if (authenticated === null) {
    return response.status(401).send("");
  }

  try {
    const assignments = await getAllAssignments();

    if (request.body && Object.keys(request.body).length > 0)
      return response.status(400).send();
    else return response.status(200).send(assignments);
  } catch (error) {
    console.log("db error");
    return response.status(400).send("");
  }
};

// Get assignment by Id
export const getAssignmentUsingId = async (request, response) => {
  if (health !== true) {
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);
  if (authenticated === null) {
    return response.status(401).send("");
  }

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });
  if (!assignment) return response.status(204).send(""); //check for no assignment status

  try {
    const id = request.params.id;
    const assignments = await getAssignmentById(id);

    if (request.body && Object.keys(request.body).length > 0)
      return response.status(400).send();
    else return response.status(200).send(assignments);
  } catch (error) {
    console.log("db error");
    return response.status(400).send("");
  }
};

// Update assignment
export const updatedAssignment = async (request, response) => {
  if (health !== true) {
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);
  if (authenticated === null) {
    return response.status(401).send("");
  }

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });
  if (!assignment) return response.status(204).send("");
  if (assignment.user_id !== authenticated) {
    return response.status(403).send("");
  }

  const bodyKeys = Object.keys(request.body);

  const requiredKeys = ["name", "points", "num_of_attempts", "deadline"];

  const optionalKeys = ["assignment_created", "assignment_updated"];

  // Check if all required keys are present
  const missingKeys = requiredKeys.filter((key) => !bodyKeys.includes(key));

  if (missingKeys.length > 0) {
    return response
      .status(400)
      .send("Missing required keys: " + missingKeys.join(", "));
  }

  // Check if there are any additional keys in the payload
  const extraKeys = bodyKeys.filter(
    (key) => !requiredKeys.includes(key) && !optionalKeys.includes(key)
  );

  if (extraKeys.length > 0) {
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
    return response.status(200).send("");
  } catch (error) {
    console.log("db error");
    return response.status(400).send("");
  }
};

// Remove assignment
export const remove = async (request, response) => {
  if (health !== true) {
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);

  if (authenticated === null) {
    return response.status(401).send("");
  }

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });
  if (!assignment) return response.status(204).send(""); //added
  if (assignment.user_id !== authenticated) {
    return response.status(403).send("");
  }

  if (request.body && Object.keys(request.body).length > 0) {
    return response.status(400).send("");
  }

  try {
    const id = request.params.id;
    await removeAssignment(id);
    return response.status(200).send("");
  } catch (error) {
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

    return response
      .status(status)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  } catch (error) {
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }
};
