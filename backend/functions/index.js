/**
 * Adel Clinic Firebase Cloud Functions
 * This file exports the compiled backend API
 */

// Import and export the API from the compiled lib directory
const {api} = require("./lib/index");

exports.api = api;
