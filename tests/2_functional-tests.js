const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  let testId1, testId2;
  
  suite('POST /api/issues/{project} => object with issue data', function() {
    
    test('Every field filled in', function(done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field filled in',
          assigned_to: 'Chai and Mocha',
          status_text: 'In QA'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'Title');
          assert.equal(res.body.issue_text, 'text');
          assert.equal(res.body.created_by, 'Functional Test - Every field filled in');
          assert.equal(res.body.assigned_to, 'Chai and Mocha');
          assert.equal(res.body.status_text, 'In QA');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'updated_on');
          assert.property(res.body, '_id');
          assert.equal(res.body.open, true);
          testId1 = res.body._id;
          done();
        });
    });
    
    test('Required fields filled in', function(done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title 2',
          issue_text: 'text',
          created_by: 'Functional Test - Required fields filled in'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'Title 2');
          assert.equal(res.body.issue_text, 'text');
          assert.equal(res.body.created_by, 'Functional Test - Required fields filled in');
          assert.equal(res.body.assigned_to, '');
          assert.equal(res.body.status_text, '');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'updated_on');
          assert.property(res.body, '_id');
          assert.equal(res.body.open, true);
          testId2 = res.body._id;
          done();
        });
    });
    
    test('Missing required fields', function(done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'required field(s) missing');
          done();
        });
    });
    
  });
  
  suite('GET /api/issues/{project} => Array of objects with issue data', function() {
    
    test('No filter', function(done) {
      chai.request(server)
        .get('/api/issues/test')
        .query({})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.property(res.body[0], 'assigned_to');
          assert.property(res.body[0], 'open');
          assert.property(res.body[0], 'status_text');
          assert.property(res.body[0], '_id');
          done();
        });
    });
    
    test('One filter', function(done) {
      chai.request(server)
        .get('/api/issues/test')
        .query({created_by: 'Functional Test - Every field filled in'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          res.body.forEach((issue) => {
            assert.equal(issue.created_by, 'Functional Test - Every field filled in');
          });
          done();
        });
    });
    
    test('Multiple filters (test for multiple fields you know will be in the db for a return)', function(done) {
      chai.request(server)
        .get('/api/issues/test')
        .query({
          open: true,
          created_by: 'Functional Test - Every field filled in'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          res.body.forEach((issue) => {
            assert.equal(issue.open, true);
            assert.equal(issue.created_by, 'Functional Test - Every field filled in');
          });
          done();
        });
    });
    
  });
  
  suite('PUT /api/issues/{project} => text', function() {
    
    test('One field to update', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: testId1,
          issue_text: 'new text'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.result, 'successfully updated');
          assert.equal(res.body._id, testId1);
          done();
        });
    });
    
    test('Multiple fields to update', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: testId2,
          issue_text: 'new text',
          issue_title: 'new title'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.result, 'successfully updated');
          assert.equal(res.body._id, testId2);
          done();
        });
    });
    
    test('No fields to update', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: testId1
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'no update field(s) sent');
          assert.equal(res.body._id, testId1);
          done();
        });
    });
    
    test('No _id submitted', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({
          issue_text: 'new text'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'missing _id');
          done();
        });
    });
    
    test('Invalid _id submitted', function(done) {
      chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: 'invalid_id',
          issue_text: 'new text'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'could not update');
          assert.equal(res.body._id, 'invalid_id');
          done();
        });
    });
    
  });
  
  suite('DELETE /api/issues/{project} => text', function() {
    
    test('Valid _id', function(done) {
      chai.request(server)
        .delete('/api/issues/test')
        .send({
          _id: testId1
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.result, 'successfully deleted');
          assert.equal(res.body._id, testId1);
          done();
        });
    });
    
    test('Invalid _id', function(done) {
      chai.request(server)
        .delete('/api/issues/test')
        .send({
          _id: 'invalid_id'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'could not delete');
          assert.equal(res.body._id, 'invalid_id');
          done();
        });
    });
    
    test('No _id submitted', function(done) {
      chai.request(server)
        .delete('/api/issues/test')
        .send({})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'missing _id');
          done();
        });
    });
    
  });

});
