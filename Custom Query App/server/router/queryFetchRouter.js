import { Router } from "express";
import queryFetch from "../controller/queryFetchController1.js";

const router = Router();

/**
 * Router for handling query fetch requests.
 * This router defines a POST endpoint to fetch queries.
 *  @route POST /fetch
 * @returns {Object} Response object with status and message
 */
router.post("/fetch", queryFetch);

export default router;
