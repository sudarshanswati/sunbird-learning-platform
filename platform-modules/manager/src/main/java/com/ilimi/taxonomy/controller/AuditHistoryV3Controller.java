package com.ilimi.taxonomy.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ilimi.common.controller.BaseController;
import com.ilimi.common.dto.Response;
import com.ilimi.common.logger.LogHelper;
import com.ilimi.taxonomy.mgr.IAuditHistoryManager;

/**
 * The Class AuditHistoryController, is the main entry point for the High Level
 * Audit Operations, mostly it holds the API Method related to Audit Logs
 * Workflow Management
 * 
 * All the Methods are backed by their corresponding manager classes, which have the
 * actual logic to communicate with the middleware and core level APIs.
 * 
 * @author Karthik, Rashmi
 */

@Controller
@RequestMapping("/v3/public/audit")
public class AuditHistoryV3Controller extends BaseController {
	
	/** The Logger */
	private static LogHelper LOGGER = LogHelper.getInstance(AuditHistoryV3Controller.class.getName());
	
	private String versionId = getAPIVersion();
	
	@Autowired
	private IAuditHistoryManager auditHistoryManager;
 

	/**
	 * This method carries all the tasks related to 'get AuditLogs By objectId' operation of
	 * AuditHistory work-flow.
	 * 
	 *
	 * @param graphId
	 *            The graphId for which the Audit History needs to be fetched
	 *            
	 * @param objectId
	 *            The objectId  for whose AuditLogs to be fetched      
	 *                 
	 * @param userId
	 *            Unique id of the user mainly for authentication purpose, It
	 *            can impersonation details as well.
	 *            
	 * @return The Response entity with details of All AuditLog for a given objectId
	 *  in its ResultSet
	 */
	@RequestMapping(value = "/list/{objectId:.+}", method = RequestMethod.GET)
	@ResponseBody
	public ResponseEntity<Response> getById(@PathVariable(value = "graphId") String graphId,
			@PathVariable(value = "objectId") String objectId,
			@RequestParam(value = "start", required = false) String startTime,
			@RequestParam(value = "end", required = false) String endTime,
			@RequestHeader(value = "user-id") String userId) {
		String apiId = "audit_history.getById";

		LOGGER.info("get AuditHistory By ObjectId | " +  "GraphId: " + graphId + " | TimeStamp1: " + startTime
				+ " | Timestamp2: " + endTime + " | ObjectId: " + objectId);
		try {
			Response response = auditHistoryManager.getAuditHistoryById(graphId, objectId, startTime, endTime, versionId);
			LOGGER.info("Find Item | Response: " + response);
			return getResponseEntity(response, apiId, null);
		} catch (Exception e) {
			LOGGER.error("Find Item | Exception: " + e.getMessage(), e);
			return getExceptionResponseEntity(e, apiId, null);
		}
	}

	/**
	 * This method carries all the tasks related to 'get LogRecord By objectId' operation of
	 * AuditHistory work-flow.
	 * 
	 * @param graphId
	 *            The graphId for which the Audit History needs to be fetched
	 *            
	 * @param objectId
	 *  	    The auditId for which the audit Log record needs to be fetched
	 *  
	 * @param userId
	 *            Unique id of the user mainly for authentication purpose, It
	 *            can impersonation details as well.
	 *            
	 * @return The Response entity with details of All Audit LogRecord for a given objectId
	 *  in its ResultSet
	 */
	@RequestMapping(value = "/read/{objectId:.+}", method = RequestMethod.GET)
	@ResponseBody
	public ResponseEntity<Response> getLogRecord(@PathVariable(value = "objectId") String objectId,
			@RequestParam(value = "timestamp", required = false) String timeStamp,
			@RequestHeader(value = "user-id") String userId) {
		String apiId = "audit_history.getLogRecordById";

		LOGGER.info("get AuditHistory By objectId | TimeStamp1: " + timeStamp
				+ " | objectId: " + objectId);
		try {
				Response response = auditHistoryManager.getAuditLogRecordById(objectId, timeStamp);
				LOGGER.info("Find Item | Response: " + response);
				return getResponseEntity(response, apiId, null);
		} catch (Exception e) {
			LOGGER.error("Find Item | Exception: " + e.getMessage(), e);
			return getExceptionResponseEntity(e, apiId, null);
		}
	}
	 protected String getAPIVersion() {
	        return API_VERSION_3;
	 }
}