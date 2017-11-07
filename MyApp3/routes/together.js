var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/together', function(req, res) {
  var post = {
    position_x : req.body.form_x,
    position_y : req.body.form_y,
    disease_type: req.body.HealthCategory,
    patient_id: req.cookies.patientId
  };
  var sql = 'insert into position set ?';
  var sql_max_id = 'select MAX(position_id) as poid from position';
  var sql_diagnosis = 'insert into diagnosis set ?';

  connection.query(sql, post,function(err, result) {
    connection.query(sql_max_id,function(err,maxId,fields) {
      var postDiagnosis = {
        position_id:maxId[0].poid,
        patient_id:req.cookies.patientId
      };
      connection.query(sql_diagnosis,postDiagnosis,function(err, diagnosis) {
        if (err) console.log(err);
        res.redirect('/together/together');


      });
    });
  });

});

router.get('/together/:bodyPosition', function(req, res) {
  var init = [];
  var post = {
    selectedPatient: init,
    patients : init,
    position : init,
    hasCookie : init,
    bodyCategory: req.params.bodyPosition,
    pp : init
  };
  var bodyPart = req.params.bodyPosition;
  var getAllPatients = "select * from patient";
  connection.query(getAllPatients,function(err, allPatients) {
    post.patients = allPatients;
    if (req.cookies.patientId) {
      post.hasCookie = true;
      post.selectedPatient = req.cookies.patientId;
      var getPositions = 'select position.position_x,position.position_y,' +
          'diagnosis.diagnosis_id, diagnosis.severity, ' +
          'diagnosis.ICD_id,diagnosis.symptom,position.disease_type,' +
          'position.position_id ' +
          'from diagnosis,position ' +
          'where diagnosis.position_id=position.position_id ' +
          'and diagnosis.patient_id=position.patient_id ' +
          'and position.patient_id=' + req.cookies.patientId;
      if(bodyPart != 'together') {
        getPositions = getPositions + ' and position.disease_type = \"' + bodyPart + '\"';
        console.log(getPositions);
      }
      getPositions = getPositions + " order by diagnosis.diagnosis_id ASC";
      connection.query(getPositions, function(err, allPositions){
        var map = {};
        for(var i in allPositions) {
          map['' +  allPositions[i].position_id] = allPositions[i];
        }
        var filteredPositions = [];
        for(var y in map) {
          filteredPositions.push(map[y]);
        }
        post.position = filteredPositions;
        res.render('together', post);
      });
    } else {
      res.render('together', post);
    }
  });
});

module.exports = router;
