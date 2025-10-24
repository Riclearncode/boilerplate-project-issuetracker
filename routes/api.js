'use strict';

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;
      // Return all issues for project, possibly filtered by query params
      const db = getDB();
      let issues = db[project] || [];

      // Apply filters from query string
      const filters = req.query || {};
      if(Object.keys(filters).length) {
        issues = issues.filter(issue => {
          for(let k in filters){
            if(k === 'open'){
              // convert to boolean
              const val = (filters[k] === 'false' || filters[k] === false) ? false : true;
              if(issue.open !== val) return false;
            } else if(String(issue[k]) !== String(filters[k])){
              return false;
            }
          }
          return true;
        });
      }

      res.json(issues);
    })
    
    .post(function (req, res){
      let project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;
      // required: issue_title, issue_text, created_by
      if(!issue_title || !issue_text || !created_by){
        return res.json({ error: 'required field(s) missing' });
      }

      const now = new Date().toISOString();
      const issue = {
        _id: generateId(),
        issue_title: issue_title || '',
        issue_text: issue_text || '',
        created_by: created_by || '',
        assigned_to: assigned_to || '',
        status_text: status_text || '',
        created_on: now,
        updated_on: now,
        open: true
      };

      const db = getDB();
      if(!db[project]) db[project] = [];
      db[project].push(issue);

      res.json(issue);
    })
    
    .put(function (req, res){
      let project = req.params.project;
      const { _id, issue_title, issue_text, created_by, assigned_to, status_text, open } = req.body;
      if(!_id) return res.json({ error: 'missing _id' });

      const db = getDB();
      const issues = db[project] || [];
      const idx = issues.findIndex(i => i._id === _id);
      if(idx === -1) return res.json({ error: 'could not update', _id });

      // check if there's at least one field to update
      if(!issue_title && !issue_text && !created_by && !assigned_to && !status_text && (open === undefined || open === null)){
        return res.json({ error: 'no update field(s) sent', _id });
      }

      const issue = issues[idx];
      if(issue_title) issue.issue_title = issue_title;
      if(issue_text) issue.issue_text = issue_text;
      if(created_by) issue.created_by = created_by;
      if(assigned_to !== undefined) issue.assigned_to = assigned_to;
      if(status_text !== undefined) issue.status_text = status_text;
      if(open !== undefined){
        // allow string or boolean
        issue.open = (open === 'false' || open === false) ? false : true;
      }
      issue.updated_on = new Date().toISOString();

      res.json({ result: 'successfully updated', _id });
    })
    
    .delete(function (req, res){
      let project = req.params.project;
      const { _id } = req.body;
      if(!_id) return res.json({ error: 'missing _id' });

      const db = getDB();
      const issues = db[project] || [];
      const idx = issues.findIndex(i => i._id === _id);
      if(idx === -1) return res.json({ error: 'could not delete', _id });

      issues.splice(idx,1);
      res.json({ result: 'successfully deleted', _id });
    });
    
};

// Simple in-memory DB for issues per project
const _DB = {};
function getDB(){
  return _DB;
}

function generateId(){
  // simple unique id
  return Date.now().toString(36) + Math.random().toString(36).substr(2,6);
}
