/**
 * =========================================================================
 * AWS Lambda Function - Student Feedback System
 * Runtime: Node.js 18.x or Node.js 20.x
 * =========================================================================
 * 
 * Note: The AWS SDK v3 (@aws-sdk/client-dynamodb and @aws-sdk/lib-dynamodb)
 * is built directly into the AWS Lambda Node.js 18.x & 20.x runtimes.
 * You can paste this code directly into the AWS Lambda Console editor!
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");

// Initialize DynamoDB Document Client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Read table name from environment variable (Defaults to "StudentFeedback")
const TABLE_NAME = process.env.TABLE_NAME || "StudentFeedback";

// Common CORS Headers for all responses
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
  "Content-Type": "application/json"
};

/**
 * Lambda Handler
 * @param {Object} event - API Gateway HTTP/REST event
 */
exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // Determine HTTP Method (supports both HTTP API v2 and REST API v1)
  const httpMethod = event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method);

  // 1. Handle CORS Preflight (OPTIONS request)
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "CORS preflight successful" })
    };
  }

  // 2. Only allow POST requests
  if (httpMethod && httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: `Method ${httpMethod} not allowed. Please use POST.` })
    };
  }

  try {
    // 3. Parse JSON request body
    let body;
    if (typeof event.body === "string") {
      try {
        const decoded = event.isBase64Encoded
          ? Buffer.from(event.body, "base64").toString("utf-8")
          : event.body;
        body = JSON.parse(decoded);
      } catch (parseError) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: "Invalid JSON format in request body."
          })
        };
      }
    } else if (typeof event.body === "object" && event.body !== null) {
      body = event.body;
    } else {
      body = event; // In case invoked directly via test event
    }

    const { studentName, usn, subject, teacherName, rating, feedback } = body || {};

    // 4. Validate input data
    const validationErrors = [];

    if (!studentName || typeof studentName !== "string" || studentName.trim().length < 2) {
      validationErrors.push("studentName must be at least 2 characters.");
    }

    if (!usn || typeof usn !== "string" || usn.trim().length < 2) {
      validationErrors.push("usn is required and must not be empty.");
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 2) {
      validationErrors.push("subject is required.");
    }

    if (!teacherName || typeof teacherName !== "string" || teacherName.trim().length < 2) {
      validationErrors.push("teacherName is required.");
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      validationErrors.push("rating must be an integer between 1 and 5.");
    }

    if (!feedback || typeof feedback !== "string" || feedback.trim().length < 10) {
      validationErrors.push("feedback must be at least 10 characters.");
    }

    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "Validation failed",
          details: validationErrors
        })
      };
    }

    // 5. Construct Feedback Item
    const feedbackId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const feedbackItem = {
      id: feedbackId,
      studentName: studentName.trim(),
      usn: usn.trim().toUpperCase(),
      subject: subject.trim(),
      teacherName: teacherName.trim(),
      rating: numericRating,
      feedback: feedback.trim(),
      timestamp: timestamp
    };

    // 6. Store Item into DynamoDB
    const putParams = {
      TableName: TABLE_NAME,
      Item: feedbackItem
    };

    console.log(`Writing item to DynamoDB table '${TABLE_NAME}' with ID: ${feedbackId}`);
    await docClient.send(new PutCommand(putParams));
    console.log("Successfully stored in DynamoDB.");

    // 7. Return 201 Created Response
    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: "Feedback submitted successfully!",
        id: feedbackId,
        timestamp: timestamp
      })
    };
  } catch (error) {
    console.error("Internal Error in Lambda Handler:", error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Failed to save feedback to DynamoDB.",
        message: error.message || "Internal server error"
      })
    };
  }
};
