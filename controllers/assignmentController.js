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
import logger from "../logger.js";
import StatsD from "node-statsd";

// // Import AWS SDK for SNS
// import AWS from "aws-sdk";

// // Create an SNS client
// const sns = new AWS.SNS();


const statsd = new StatsD({ host: "localhost", port: 8125 });

const health = await healthCheck();

// Create assignment
export const post = async (request, response) => {
  try {
    if (health !== true) {
      logger.error("Health check failed. Unable to create assignment.");
      return response
        .status(503)
        .header("Cache-Control", "no-cache, no-store, must-revalidate")
        .send("");
    }

    const authenticated = await authUser(request, response);

    if (authenticated === null) {
      logger.warn("Authentication failed. Unable to create assignment.");
      return response.status(401).send("");
    }

    // Increment custom metric for post API calls
    statsd.increment("api.post.calls");

    const bodyKeys = Object.keys(request.body);
    const requiredKeys = ["name", "points", "num_of_attempts", "deadline"];
    const optionalKeys = ["assignment_created", "assignment_updated"];

    // Check if all required keys are present
    const missingKeys = requiredKeys.filter((key) => !bodyKeys.includes(key));

    if (missingKeys.length > 0) {
      logger.warn(
        "Missing required keys in the payload:",
        missingKeys.join(", ")
      );
      return response
        .status(400)
        .send("Missing required keys: " + missingKeys.join(", "));
    }

    // Check if there are any additional keys in the payload
    const extraKeys = bodyKeys.filter(
      (key) => !requiredKeys.includes(key) && !optionalKeys.includes(key)
    );

    if (extraKeys.length > 0) {
      logger.warn("Invalid keys in the payload:", extraKeys.join(", "));
      return response
        .status(400)
        .send("Invalid keys in the payload: " + extraKeys.join(", "));
    }

    if (typeof request.body.name !== "string") {
      return response.status(400).json({
        message: "Name must be an string.",
      });
    }

    // Check if 'points' is an integer
    if (!Number.isInteger(request.body.points)) {
      return response.status(400).json({
        message: "Points must be an integer.",
      });
    }

    // Check if 'num_of_attempts' is an integer
    if (!Number.isInteger(request.body.num_of_attempts)) {
      return response.status(400).json({
        message: "Number_of_attempts must be an integer.",
      });
    }

    // Check if 'deadline' is a valid date
    const deadlineDate = new Date(request.body.deadline);
    if (isNaN(deadlineDate.getTime())) {
      return response.status(400).json({
        message: "Deadline must be an valid date.",
      });
    }

    try {
      const newDetails = {
        ...request.body,
        user_id: authenticated,
        assignment_created: new Date().toISOString(),
        assignment_updated: new Date().toISOString(),
      };
      await addAssignment(newDetails);
      logger.info("Assignment has been successfully created.");
      return response.status(201).send("");
    } catch (error) {
      logger.error("Error creating assignment:", error);
      return response.status(400).send("");
    }
  } catch {
    logger.error("Syntax error in the request");
    return response.status(400).json({ error: "Syntax error" }).send();
  }
};

// Get all assignments
export const getAssignments = async (request, response) => {
  if (health !== true) {
    logger.error("Health check failed. Unable to retrieve all assignments.");
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);

  if (authenticated === null) {
    logger.warn("Authentication failed. Unable to retrieve all assignments.");
    return response.status(401).send("");
  }

  // Increment custom metric for post API calls
  statsd.increment("api.getAssignments.calls");

  try {
    const assignments = await getAllAssignments();

    if (request.body && Object.keys(request.body).length > 0) {
      logger.warn("Invalid request body. Unable to retrieve all assignments.");
      return response.status(400).send();
    } else {
      logger.info("All assignments have been successfully retrieved.");
      return response.status(200).send(assignments);
    }
  } catch (error) {
    logger.error("Error retrieving all assignments:", error);
    return response.status(400).send("");
  }
};

// Get assignment by Id
export const getAssignmentUsingId = async (request, response) => {
  if (health !== true) {
    logger.error("Health check failed. Unable to retrieve assignment by ID.");
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);
  if (authenticated === null) {
    logger.warn("Authentication failed. Unable to retrieve assignment by ID.");
    return response.status(401).send("");
  }

  // Increment custom metric for post API calls
  statsd.increment("api.getAssignmentUsingId.calls");

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });

  if (!assignment) {
    logger.warn(
      `Assignment with ID ${request.params.id} not found. Unable to retrieve assignment by ID.`
    );
    return response.status(404).send("");
  }

  try {
    const id = request.params.id;
    const assignments = await getAssignmentById(id);

    if (request.body && Object.keys(request.body).length > 0) {
      logger.warn("Invalid request body. Unable to retrieve assignment by ID.");
      return response.status(400).send();
    } else {
      logger.info(`Assignment with ID ${id} has been successfully retrieved.`);
      return response.status(200).send(assignments);
    }
  } catch (error) {
    logger.error("Error retrieving assignment by ID:", error);
    return response.status(400).send("");
  }
};

// Update assignment
export const updatedAssignment = async (request, response) => {
  if (health !== true) {
    logger.error("Health check failed. Unable to update assignment.");
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);
  if (authenticated === null) {
    logger.warn("Authentication failed. Unable to update assignment.");
    return response.status(401).send("");
  }

  // Increment custom metric for post API calls
  statsd.increment("api.updatedAssignment.calls");

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });

  if (!assignment) {
    logger.warn(
      `Assignment with ID ${request.params.id} not found. Unable to update assignment.`
    );
    return response.status(404).send("");
  }

  if (assignment.user_id !== authenticated) {
    logger.warn(
      `Permission denied. User ${authenticated} does not have access to update assignment with ID ${request.params.id}.`
    );
    return response.status(403).send("");
  }

  const bodyKeys = Object.keys(request.body);

  const requiredKeys = ["name", "points", "num_of_attempts", "deadline"];

  const optionalKeys = ["assignment_created", "assignment_updated"];

  // Check if all required keys are present
  const missingKeys = requiredKeys.filter((key) => !bodyKeys.includes(key));

  if (missingKeys.length > 0) {
    logger.warn(
      "Missing required keys in the payload:",
      missingKeys.join(", ")
    );
    return response
      .status(400)
      .send("Missing required keys: " + missingKeys.join(", "));
  }

  // Check if there are any additional keys in the payload
  const extraKeys = bodyKeys.filter(
    (key) => !requiredKeys.includes(key) && !optionalKeys.includes(key)
  );

  if (extraKeys.length > 0) {
    logger.warn("Invalid keys in the payload:", extraKeys.join(", "));
    return response
      .status(400)
      .send("Invalid keys in the payload: " + extraKeys.join(", "));
  }

  if (typeof request.body.name !== "string") {
    return response.status(400).json({
      message: "Name must be an string.",
    });
  }

  // Check if 'points' is an integer
  if (!Number.isInteger(request.body.points)) {
    return response.status(400).json({
      message: "Points must be an integer.",
    });
  }

  // Check if 'num_of_attempts' is an integer
  if (!Number.isInteger(request.body.num_of_attempts)) {
    return response.status(400).json({
      message: "Number_of_attempts must be an integer.",
    });
  }

  // Check if 'deadline' is a valid date
  const deadlineDate = new Date(request.body.deadline);
  if (isNaN(deadlineDate.getTime())) {
    return response.status(400).json({
      message: "Deadline must be an valid date.",
    });
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
    logger.error("Error updating assignment:", error);
    console.log("db error");
    return response.status(400).send("");
  }
};

// Remove assignment
export const remove = async (request, response) => {
  if (health !== true) {
    logger.error("Health check failed. Unable to remove assignment.");
    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }

  const authenticated = await authUser(request, response);

  if (authenticated === null) {
    logger.warn("Authentication failed. Unable to remove assignment.");
    return response.status(401).send("");
  }

  // Increment custom metric for post API calls
  statsd.increment("api.remove.calls");

  const assignment = await db.assignment.findOne({
    where: { id: request.params.id },
  });

  if (!assignment) {
    logger.warn(
      `Assignment with ID ${request.params.id} not found. Unable to remove assignment.`
    );
    return response.status(404).send("");
  }

  if (assignment.user_id !== authenticated) {
    logger.warn(
      `Permission denied. User ${authenticated} does not have access to remove assignment with ID ${request.params.id}.`
    );
    return response.status(403).send("");
  }

  if (request.body && Object.keys(request.body).length > 0) {
    logger.warn("Invalid request body. Unable to remove assignment.");
    return response.status(400).send("");
  }

  try {
    const id = request.params.id;
    await removeAssignment(id);
    logger.info(`Assignment with ID ${id} has been successfully removed.`);
    return response.status(204).send("");
  } catch (error) {
    logger.error("Error removing assignment:", error);
    console.log("db error");
    return response.status(400).send("");
  }
};


//Post Submissions
export const postSubmission = async (request, response) => {
  try {
    if (health !== true) {
      logger.error("Health check failed. Unable to create assignment.");
      return response
        .status(503)
        .header("Cache-Control", "no-cache, no-store, must-revalidate")
        .send("");
    }

    const authenticated = await authUser(request, response);

    if (authenticated === null) {
      logger.warn("Authentication failed. Unable to create assignment.");
      return response.status(401).send("");
    }

    // Increment custom metric for post API calls
    statsd.increment("api.postSubmission.calls");

    // Check if submission_url is present in the payload
    if (!request.body.submission_url) {
      return response.status(400).json({
        message: "Submission URL is required.",
      });
    }

    // Validate the submission URL format (you may want to enhance this validation)
    const submissionUrlRegex = /^https:\/\/github\.com\/.*\.zip$/;
    if (!submissionUrlRegex.test(request.body.submission_url)) {
      return response.status(400).json({
        message: "Invalid submission URL format.",
      });
    }

    // Retrieve assignment details
    const assignment = await db.assignment.findOne({
      where: { id: request.params.assignment_id, user_id: request.params.user_id},
    });


    const submission = await db.submission.findOne({
      where: { id: request.params.id },
    });

    if (!assignment) {
      logger.warn(`Assignment with ID ${request.params.id} not found.`);
      return response.status(404).send("");
    }

    // Check if the user has exceeded the maximum number of attempts (retries)
    if (assignment.num_of_attempts < submission.attempts) {
      logger.warn(`User has exceeded the maximum number of attempts.`);
      return response.status(400).json({
        message: "Exceeded maximum number of attempts.",
      });
    }

    // Check if the due date has passed
    const currentDateTime = new Date();
    const deadlineDateTime = new Date(assignment.deadline);

    if (currentDateTime > deadlineDateTime) {
      logger.warn(`Submission deadline has passed.`);
      return response.status(400).json({
        message: "Submission deadline has passed.",
      });
    }

    // Increment the attempts count
    submission.attempts += 1;
    await assignment.save();//check!!!!

    // // Construct the message to be sent to the SNS topic
    // const snsMessage = {
    //   id: assignment.id,
    //   assignment_id: assignment.assignment_id,
    //   submission_url: request.body.submission_url,
    //   submission_date: new Date().toISOString(),
    //   assignment_updated: new Date().toISOString(),
    //   user_info: {
    //     email: authenticated, // authenticated is the user's email
    //   },
    // };

    // // Publish the message to the SNS topic
    // await sns
    //   .publish({
    //     TopicArn: "YOUR_SNS_TOPIC_ARN",
    //     Message: JSON.stringify(snsMessage),
    //   })
    //   .promise();

    logger.info("Submission has been successfully accepted.");
    return response.status(201).send("");
  } 
  catch (error) {
    logger.error("Error processing submission:", error);
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
    // Increment custom metric for post API calls
    statsd.increment("api.healthz.calls");
    const health = await healthCheck();
    const status = health ? 200 : 503;

    // Log health check status
    if (health) {
      logger.info("Health check succeeded");
    } else {
      logger.error("Health check failed");
    }

    return response
      .status(status)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  } catch (error) {
    logger.error("Error during health check:", error);

    return response
      .status(503)
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .send("");
  }
};
