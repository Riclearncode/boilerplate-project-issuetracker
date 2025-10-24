const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
	this.timeout(5000);

	let id1 = null;
	let id2 = null;

	suite('POST /api/issues/{project} => create issues', function(){
		test('Create an issue with every field', function(done){
			chai.request(server)
				.post('/api/issues/test')
				.send({
					issue_title: 'Title',
					issue_text: 'text',
					created_by: 'Functional Test - Every field',
					assigned_to: 'Chai and Mocha',
					status_text: 'In QA'
				})
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.property(res.body, '_id');
					assert.equal(res.body.issue_title, 'Title');
					assert.equal(res.body.issue_text, 'text');
					assert.equal(res.body.created_by, 'Functional Test - Every field');
					id1 = res.body._id;
					done();
				});
		});

		test('Create an issue with only required fields', function(done){
			chai.request(server)
				.post('/api/issues/test')
				.send({
					issue_title: 'Required',
					issue_text: 'Only required fields',
					created_by: 'Functional Test - Required'
				})
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.property(res.body, '_id');
					assert.equal(res.body.issue_title, 'Required');
					id2 = res.body._id;
					done();
				});
		});

		test('Create an issue with missing required fields', function(done){
			chai.request(server)
				.post('/api/issues/test')
				.send({
					issue_title: 'Missing',
					issue_text: ''
				})
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.property(res.body, 'error');
					assert.equal(res.body.error, 'required field(s) missing');
					done();
				});
		});
	});

	suite('GET /api/issues/{project} => view issues', function(){
		test('View issues on a project', function(done){
			chai.request(server)
				.get('/api/issues/test')
				.query({})
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					assert.isAtLeast(res.body.length, 2);
					done();
				});
		});

		test('View issues on a project with one filter', function(done){
			chai.request(server)
				.get('/api/issues/test')
				.query({ created_by: 'Functional Test - Required' })
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					// all returned should match filter
					res.body.forEach(i => assert.equal(i.created_by, 'Functional Test - Required'));
					done();
				});
		});

		test('View issues on a project with multiple filters', function(done){
			chai.request(server)
				.get('/api/issues/test')
				.query({ created_by: 'Functional Test - Every field', issue_title: 'Title' })
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					res.body.forEach(i => {
						assert.equal(i.created_by, 'Functional Test - Every field');
						assert.equal(i.issue_title, 'Title');
					});
					done();
				});
		});
	});

	suite('PUT /api/issues/{project} => update issues', function(){
		test('Update one field on an issue', function(done){
			chai.request(server)
				.put('/api/issues/test')
				.send({ _id: id1, issue_text: 'updated text' })
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.equal(res.body.result, 'successfully updated');
					assert.equal(res.body._id, id1);
					done();
				});
		});

		test('Update multiple fields on an issue', function(done){
			chai.request(server)
				.put('/api/issues/test')
				.send({ _id: id2, issue_text: 'multi update', assigned_to: 'Someone', status_text: 'Done' })
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.equal(res.body.result, 'successfully updated');
					assert.equal(res.body._id, id2);
					done();
				});
		});

		test('Update an issue with missing _id', function(done){
			chai.request(server)
				.put('/api/issues/test')
				.send({ issue_text: 'no id' })
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.property(res.body, 'error');
					assert.equal(res.body.error, 'missing _id');
					done();
				});
		});

		test('Update an issue with no fields to update', function(done){
			chai.request(server)
				.put('/api/issues/test')
				.send({ _id: id1 })
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.equal(res.body.error, 'no update field(s) sent');
					assert.equal(res.body._id, id1);
					done();
				});
		});

		test('Update an issue with an invalid _id', function(done){
			chai.request(server)
				.put('/api/issues/test')
				.send({ _id: 'invalidid123', issue_text: 'won\'t work' })
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.equal(res.body.error, 'could not update');
					assert.equal(res.body._id, 'invalidid123');
					done();
				});
		});
	});

	suite('DELETE /api/issues/{project} => delete issues', function(){
		test('Delete an issue', function(done){
			chai.request(server)
				.delete('/api/issues/test')
				.send({ _id: id1 })
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.equal(res.body.result, 'successfully deleted');
					assert.equal(res.body._id, id1);
					done();
				});
		});

		test('Delete an issue with an invalid _id', function(done){
			chai.request(server)
				.delete('/api/issues/test')
				.send({ _id: 'notexist123' })
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.equal(res.body.error, 'could not delete');
					assert.equal(res.body._id, 'notexist123');
					done();
				});
		});

		test('Delete an issue with missing _id', function(done){
			chai.request(server)
				.delete('/api/issues/test')
				.send({})
				.end(function(err, res){
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.equal(res.body.error, 'missing _id');
					done();
				});
		});
	});

});
