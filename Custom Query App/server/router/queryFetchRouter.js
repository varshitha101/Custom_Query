import { Router } from "express";
import queryFetch_V1 from "../controller/queryFetchController1.js";
import queryFetch_V2 from "../controller/queryFetchController.js";

const router = Router();

/**
 * Router for handling query fetch requests.
 * This router defines a POST endpoint to fetch queries.
 *  @route POST /fetch
 * @returns {Object} Response object with status and message
 */
router.post("/fetch/V1", queryFetch_V1);
router.post("/fetch/V2", queryFetch_V2);

export default router;
