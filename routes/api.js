'use strict';

// In-memory storage for issues
let issues = {};

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;
      
      // Get all issues for the project
      let projectIssues = issues[project] || [];
      
      // Apply filters from query parameters
      let filteredIssues = projectIssues.filter(issue => {
        for (let key in req.query) {
          if (req.query[key] !== undefined) {
            // Convert boolean strings to actual booleans for 'open' field
            if (key === 'open') {
              if (req.query[key] === 'true' && !issue[key]) return false;
              if (req.query[key] === 'false' && issue[key]) return false;
            } else {
              if (issue[key] !== req.query[key]) return false;
            }
          }
        }
        return true;
      });
      
      res.json(filteredIssues);
    })
    
    .post(function (req, res){
      let project = req.params.project;
      
      // Check for required fields
      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by) {
        return res.json({ error: 'required field(s) missing' });
      }
      
      // Create new issue
      let newIssue = {
        _id: generateId(),
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
        open: true
      };
      
      // Initialize project array if it doesn't exist
      if (!issues[project]) {
        issues[project] = [];
      }
      
      // Add issue to project
      issues[project].push(newIssue);
      
      res.json(newIssue);
    })
    
    .put(function (req, res){
      let project = req.params.project;
      
      // Check if _id is provided
      if (!req.body._id) {
        return res.json({ error: 'missing _id' });
      }
      
      let _id = req.body._id;
      
      // Check if there are fields to update
      let updateFields = Object.keys(req.body).filter(key => key !== '_id' && req.body[key] !== '');
      
      if (updateFields.length === 0) {
        return res.json({ error: 'no update field(s) sent', '_id': _id });
      }
      
      // Find the issue
      let projectIssues = issues[project] || [];
      let issueIndex = projectIssues.findIndex(issue => issue._id === _id);
      
      if (issueIndex === -1) {
        return res.json({ error: 'could not update', '_id': _id });
      }
      
      // Update the issue
      let issue = projectIssues[issueIndex];
      
      updateFields.forEach(field => {
        if (field === 'open') {
          issue[field] = req.body[field] === 'false' ? false : true;
        } else {
          issue[field] = req.body[field];
        }
      });
      
      issue.updated_on = new Date().toISOString();
      
      res.json({ result: 'successfully updated', '_id': _id });
    })
    
    .delete(function (req, res){
      let project = req.params.project;
      
      // Check if _id is provided
      if (!req.body._id) {
        return res.json({ error: 'missing _id' });
      }
      
      let _id = req.body._id;
      
      // Find and delete the issue
      let projectIssues = issues[project] || [];
      let issueIndex = projectIssues.findIndex(issue => issue._id === _id);
      
      if (issueIndex === -1) {
        return res.json({ error: 'could not delete', '_id': _id });
      }
      
      // Remove the issue
      projectIssues.splice(issueIndex, 1);
      
      res.json({ result: 'successfully deleted', '_id': _id });
    });
    
};

// Helper function to generate unique IDs
function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
