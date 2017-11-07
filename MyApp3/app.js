var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var routes = require('./routes/index');
//var together = require('./routes/together');

var app = express();

var mysql = require('mysql');
var fs = require('fs');
var multer = require('multer');

var connection = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'root',
  database:'thesis2',
  multipleStatements: true
});

connection.connect(function(err){});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
//app.use('/together', together);

// catch 404 and forward to error handler

app.post('/createUserPost', function(req, res) {
  var post = { patient_name : req.body.inputname,
    sex: req.body.inputsex,
    birth_date: req.body.inputbirthdate,
    photo: req.body.inputphoto,
    blood_type:req.body.inputbloodtype,
    address:req.body.inputaddress,
    phone:req.body.inputphone,
    allergies:req.body.inputallergies,
    risk:req.body.inputrisk,
    mother:req.body.inputmother,
    father:req.body.inputfather,
    paternal_grand_mother:req.body.inputpaternalgrandmother,
    paternal_grand_father:req.body.inputpaternalgrandfather,
    maternal_grand_mother:req.body.inputmaternalgrandmother,
    maternal_grand_father:req.body.inputmaternalgrandfather
  };
  var sql = 'insert into patient set ?';
  connection.query(sql,post, function(err, results){
    if(err) {
      console.log(err.message);
    } else {
      console.log('success');
    }
    res.redirect("/together/together");
  });

});  // insert in user

app.post('/together', function(req, res) {
  var post = {
    position_x : req.body.form_x,
    position_y : req.body.form_y,
    disease_type: req.body.HealthCategory,
    patient_id: req.cookies.patientId,
    doctor_id :1
  };
  var sql = 'insert into position_doctor set ?';
  var sql_max_id = 'select MAX(position_doctor_id) as poid from position_doctor';
  var sql_diagnosis = 'insert into diagnosis set ?';

  connection.query(sql, post,function(err, result) {
    connection.query(sql_max_id,function(err,maxId,fields) {
      var postDiagnosis = {
        position_doctor_id:maxId[0].poid,
        patient_id:req.cookies.patientId,
        doctor_id :1
      };
      connection.query(sql_diagnosis,postDiagnosis,function(err, diagnosis) {
        if (err) console.log(err);
        res.redirect('/together/together');


      });
    });
  });

});

app.get('/together/:bodyPosition', function(req, res) {
  var init = [];
  var post = {
    selectedPatient: init,
    patients : init,
    position_doctor : init,
    s_position: init,
    d_position: init,
    hasCookie : init,
    bodyCategory: req.params.bodyPosition,
    pp : init,
    
  };
  var bodyPart = req.params.bodyPosition;
  var getAllPatients = "select * from patient";
  connection.query(getAllPatients,function(err, allPatients) {
    post.patients = allPatients;
    if (req.cookies.patientId) {
      post.hasCookie = true;
      post.selectedPatient = req.cookies.patientId;
      var getPositions = 'select position_doctor.position_x,position_doctor.position_y,' +
          'diagnosis.diagnosis_id, diagnosis.severity,diagnosis.start_time, ' +
          'diagnosis.ICD_id,diagnosis.symptom,position_doctor.disease_type,' +
          'position_doctor.position_doctor_id ' +
          'from diagnosis,position_doctor ' +
          'where diagnosis.position_doctor_id=position_doctor.position_doctor_id ' +
          'and diagnosis.patient_id=position_doctor.patient_id ' +
          'and diagnosis.doctor_id=position_doctor.doctor_id ' +
          'and position_doctor.doctor_id = 1 ' +
          'and position_doctor.patient_id=' + req.cookies.patientId ;
      //console.log(getPositions);
      var getSPositions='select s_position.position_x,s_position.position_y,'+
          'symptom.symptom_id,s_position.s_position_id,'+
          'symptom.symptom,symptom.severity ,'+
          'symptom.start_time,symptom.end_time'+
          ' from s_position,symptom '+
          'WHERE s_position.s_position_id = symptom.s_position_id '+
          'AND s_position.patient_id = symptom.patient_id ' +
          'AND s_position.doctor_id = symptom.doctor_id ' +
          'AND s_position.patient_id =1 ' +
          'AND s_position.doctor_id = 1';

      // console.log(getSPositions);
      getSPositions = getSPositions + " order by symptom.symptom_id ASC";

      var getDPositions='select d_position.position_x,d_position.position_y,'+
          'p_diagnosis.diagnosis_id,d_position.d_position_id,'+
          'p_diagnosis.symptom,p_diagnosis.severity, '+
          'p_diagnosis.start_time,p_diagnosis.end_time, '+
          'p_diagnosis.clinical_note '+
          ' from d_position,p_diagnosis '+
          'WHERE d_position.d_position_id = p_diagnosis.d_position_id '+
          'AND d_position.patient_id = p_diagnosis.patient_id ' +
          'AND d_position.doctor_id = p_diagnosis.doctor_id ' +
          'AND d_position.patient_id =1 ' +
          'AND d_position.doctor_id = 1';


      getDPositions = getDPositions + " order by p_diagnosis.diagnosis_id ASC";

      connection.query(getSPositions, function(err, allSPositions){
        var map1 = {};
        for(var i in allSPositions) {
          map1[' ' +  allSPositions[i].s_position_id] = allSPositions[i];
        }
        var filteredPositions1 = [];
        for(var y in map1) {
          filteredPositions1.push(map1[y]);
        }

        post.s_position = filteredPositions1;

      });

      connection.query(getDPositions, function(err, allPositions){
        var map = {};
        for(var i in allPositions) {
          map[' ' +  allPositions[i].d_position_id] = allPositions[i];
        }
        var filteredPositions2 = [];
        for(var y in map) {
          filteredPositions2.push(map[y]);
        }
        // console.log(filteredPositions);
        post.d_position = filteredPositions2;
        // res.render('PHR', post);

      });

      if(bodyPart != 'together') {
        getPositions = getPositions + ' and position_doctor.disease_type = \"' + bodyPart + '\"';
        console.log(getPositions);
      }
      getPositions = getPositions + " order by diagnosis.diagnosis_id ASC";
      connection.query(getPositions, function(err, allPositions){
       // console.log(allPositions);
        var map = {};
        for(var i in allPositions) {
          map['' +  allPositions[i].position_doctor_id] = allPositions[i];
        }
        var filteredPositions = [];
        for(var y in map) {
          filteredPositions.push(map[y]);
        }
        post.position_doctor = filteredPositions;
        res.render('together', post);
      });
    } else {
      res.render('together', post);
    }
  });
});

app.post('/cookiePost',function(req,res){
  var minute = 60*100000;
  if(req.body.patientID && req.body.patientID != ""){
    //console.log(req.body.patientID);
    res.cookie('patientId', req.body.patientID,{maxAge:minute});
  }
  res.redirect("/together/together");
});  // set patientId as cookie

app.get('/history/type=:type/position=:id',function(req,res) {
  var getAllHistory = "select position_doctor.disease_type, history.* from position_doctor, history " +
      " where history.position_doctor_id = position_doctor.position_doctor_id and history.doctor_id = 1 and history.patient_id = " + req.cookies.patientId;
  var init = "";
  var postArray = [];
  var postArray2 = [];
  var postArray3 = [];
  var id = req.params.id;
  var type = req.params.type;

  var getSymptomHistory = "select * from symptom_history " +
      " where symptom_history.doctor_id = 1 and symptom_history.patient_id = " + req.cookies.patientId;
  var getDiseaseName = "select major_disease.disease_name from major_disease " +
      " where  major_disease.doctor_id = 1 and major_disease.patient_id = " + req.cookies.patientId;
  if (isNaN(id)) {
    getAllHistory = "select position_doctor.disease_type, history.* from history, position_doctor" +
        " where history.position_doctor_id = position_doctor.position_doctor_id and history.doctor_id = 1 and history.patient_id = " + req.cookies.patientId +
        " and position_doctor.disease_type= '" + id + "'";
    var getSymptomHistory = "select symptom_history.* from symptom_history " +
        " where symptom_history.doctor_id = 1 and symptom_history.patient_id = " + req.cookies.patientId +
        " and symptom_history.position_doctor_id = (select position_doctor_id from position_doctor where position_doctor.disease_type= '" + id + "')";


    // console.log(getAllHistory);
    //console.log(getSymptomHistory);
  } else {
    if (id != 0) {
      getAllHistory = getAllHistory + " and history.position_doctor_id = " + id;
      getSymptomHistory = getSymptomHistory + " and symptom_history.position_doctor_id = " + id;


      console.log(getAllHistory);

    }
  }

  if (type == "MajorDisease"){
    var getAllHistory = "select position_doctor.disease_type,major_disease.* from major_disease,position_doctor " +
        " where  major_disease.position_doctor_id = position_doctor.position_doctor_id and major_disease.doctor_id = 1 and major_disease.patient_id = " + req.cookies.patientId;
}
  connection.query(getDiseaseName,function(err,results){
   
   // console.log(results);
    for (var i in results) {
      var post3 = {
        disease_name :init
      };
      post3.disease_name = results[i].disease_name;
      postArray3.push(post3);
      break;
    };
    console.log(post3);
  });

  connection.query(getSymptomHistory,function(err,results){

  // console.log(results);
    for (var i in results) {
      var post2 = {
        s_start_time: init,
        s_healing_time : init,
        symptom: init
      };
      htime = results[i].s_start_time;
      etime =results[i].s_healing_time;
      post2.symptom = results[i].symptom;
      post2.s_start_time = [htime.getFullYear() + "", htime.getMonth() + "", htime.getDate() + ""].join(",");
      post2.s_healing_time = [etime.getFullYear() + "", etime.getMonth() + "", etime.getDate() + ""].join(",");
      postArray2.push(post2);
    }

  });

  connection.query(getAllHistory,function(err, results){

    if(err) console.log(err);
    if(type == "all") {
     // console.log(getAllHistory);

      for (var i in results) {
        var post = {
          starttime: init,
          endtime: init,
          content: init,
          contenttype:init,
          disease_type:init,
          id : init,
          position_id: init
        };
        post.disease_type = results[i].disease_type;
        post.contenttype = results[i].contenttype;
        post.position_id = results[i].position_id;
        post.disease_type = results[i].disease_type;
        var htime = results[i].start_time;
        var etime = results[i].end_time;
        var tempContent = "";
        post.starttime = [htime.getFullYear() + "", htime.getMonth() + "", htime.getDate() + ""].join(",");
       // post.endtime = [etime.getFullYear() + "", etime.getMonth() + "", etime.getDate() + ""].join(",");

        if (results[i].diagnosis_id) {
          post.contenttype = 'diagnosis';
          post.id = results[i].diagnosis_id;
          tempContent = tempContent + "/images/diagnosis.jpg";
        }
        if (results[i].treatment_id) {
          post.contenttype = 'treatment';
          post.id = results[i].treatment_id;
          tempContent = tempContent + "/images/treatment.jpg";
        }
        if (results[i].medication_id) {
          post.contenttype = 'medication';
          post.id = results[i].medication_id;
          tempContent = tempContent + "/images/medication.jpg";
        }
        if (results[i].bloodtest_id) {
          post.contenttype = 'bloodtest';
          post.id = results[i].bloodtest_id;
          tempContent = tempContent + "/images/bloodtest.jpg";
        }
        if (results[i].scanning_id) {
          post.contenttype = 'scanning';
          post.id = results[i].scanning_id;
          tempContent = tempContent + "/images/scanning.jpg";
        }
        post.content = tempContent;
        postArray.push(post);
      }
    } else if(type != "MajorDisease"){
      var typeName = type+"_id";
      for (var i in results) {
        var post = {
          starttime: init,
          endtime: init,
          content: init,
          contenttype : type,
          disease_type : init,
          id: init
        };

        post.disease_type = results[i].disease_type;

        var htime = results[i].start_time;
        var etime = results[i].end_time;
        var tempContent = "";
        post.starttime = [htime.getFullYear() + "", htime.getMonth() + "", htime.getDate() + ""].join(",");
        post.endtime = [etime.getFullYear() + "", etime.getMonth() + "", etime.getDate() + ""].join(",");
        if ((results[i])[typeName]) {
          post.id = (results[i])[typeName];
          tempContent = tempContent + "/images/"+type+".jpg";
        }
        post.content = tempContent;
        if(tempContent != "") {
          postArray.push(post);
        }
      }
    }else if(type == "MajorDisease"){
      for (var i in results) {
        var post = {
          starttime: init,
          endtime: init,
          content: init,
          contenttype:init,
          disease_type:init,
          id : init,
          position_id: init
        };
        post.contenttype = results[i].type;
        post.position_id = results[i].position_doctor_id;
        post.disease_type = results[i].disease_type;
        post.id = results[i].major_disease_id;
        var htime = results[i].start_time;
        var etime = results[i].end_time;
        var tempContent = "";
        post.starttime = [htime.getFullYear() + "", htime.getMonth() + "", htime.getDate() + ""].join(",");
      // post.endtime = [etime.getFullYear() + "", etime.getMonth() + "", etime.getDate() + ""].join(",");
        if (results[i].type == 'diagnosis') {
          tempContent = tempContent + "/images/diagnosis.jpg";
        }
        post.content = tempContent;
        postArray.push(post);
      }
    }

    res.render('history',{allData: postArray,allData2:postArray2,allData3:postArray3});
  });
});

app.post('/diagnosisPost',function(req,res){
  var addDiagnosis = "insert into diagnosis set ?";
  var getMaxId = "select Max(diagnosis_id) as tid from diagnosis";
  var addHistory = "insert into history set ?";
  var postDiagnosis = {
    ICD_id: req.body.dialogdiagnosisicd,
    severity: req.body.dialogdiagnosisseverity,
    symptom: req.body.dialogdiagnosissymptom,
    start_time: req.body.dialogdiagnosisstart_time,
    end_time: req.body.dialogdiagnosisend_time,
    clinical_note: req.body.dialogdiagnosisnote,
    position_doctor_id: req.body.doctor_circleId,
    patient_id: req.cookies.patientId,
    doctor_id :1
  };
  //console.log(postDiagnosis);
  connection.query(addDiagnosis, postDiagnosis, function(err,result) {
    if(err) console.log(err);
    console.log(result);
    connection.query(getMaxId,function(err, maxId){
      var diagnosisId = maxId[0].tid;
      var postHistory ={
        patient_id: req.cookies.patientId,
        doctor_id : 1,
        position_doctor_id: req.body.doctor_circleId,
        diagnosis_id: diagnosisId,
        start_time:req.body.dialogdiagnosisstart_time,
        end_time:req.body.dialogdiagnosisend_time
      };
      connection.query(addHistory,postHistory,function(err,results){
        res.redirect('/together/together');
      });
    });
    });
});

app.post('/treatmentPost',function(req,res){
  var addTreatment = "insert into treatment set ?";
  var getMaxId = "select Max(treatment_id) as tid from treatment";
  var addHistory = "insert into history set ?";
  var postTreatment = {
    patient_id: req.cookies.patientId,
    doctor_id :1,
    position_doctor_id: req.body.doctor_circleId,
    treatment_name: req.body.dialogtreatmentname,
    start_time: req.body.dialogtreatmentstart_time,
    end_time: req.body.dialogtreatmentend_time,
    clinical_note: req.body.dialogtreatmentnote
  };
  connection.query(addTreatment,postTreatment,function(err, result) {
    if(err) console.log(err);
    console.log(result);
    connection.query(getMaxId,function(err, maxId){
      var treatmentId = maxId[0].tid;
      var postHistory ={
        patient_id: req.cookies.patientId,
        doctor_id : 1,
        position_doctor_id: req.body.doctor_circleId,
        treatment_id: treatmentId,
        start_time: req.body.dialogtreatmentstart_time,
        end_time: req.body.dialogtreatmentend_time
      };
      connection.query(addHistory,postHistory,function(err,results){
        res.redirect('/together/together');
      });
    });

  });

});

app.post('/medicationPost',function(req,res){
  var addMedication = "insert into medication set ?";
  var getMaxId = "select Max(medication_id) as tid from medication";
  var addHistory = "insert into history set ?";
  var postMedication = {
    patient_id: req.cookies.patientId,
    doctor_id : 1,
    position_doctor_id: req.body.doctor_circleId,
    drug_name: req.body.dialogmedicationname,
    dosage: req.body.dialogmedicationdosage,
    frequency: req.body.dialogmedicationfrequency,
    start_time: req.body.dialogmedicationstart_time,
    end_time: req.body.dialogmedicationend_time,
    clinical_note: req.body.dialogmedicationtnote
  };

  connection.query(addMedication,postMedication,function(err, result) {
    if(err) console.log(err);
    //console.log(result);
    connection.query(getMaxId,function(err, maxId){
      var medicationId = maxId[0].tid;
      var postHistory ={
        patient_id: req.cookies.patientId,
        doctor_id : 1,
        position_doctor_id: req.body.doctor_circleId,
        medication_id: medicationId,
        start_time: req.body.dialogmedicationstart_time,
        end_time: req.body.dialogmedicationend_time
      };
      connection.query(addHistory,postHistory,function(err,results){
        res.redirect('/together/together');
      });
    });

  });
});

app.post('/scanPost', function(req,res){
  console.log(req.files.image.path);
  console.log("Scan : " + req.files.image.name);
  console.log("Scan : " + req.body.dialogscannote);
  console.log("Scan : " + req.body.circleId);
  var time = new Date();
  var filename = [time.getFullYear(),time.getMonth()+1,time.getDate(),time.getHours(),time.getMinutes(),time.getSeconds()].join("");
  filename = filename + ".png";
  var init =[];
  var post = {
    image_url: init,
    patient_id: init,
    position_id: init,
    clinical_note: init
  };
  var postHistory = {
    start_time: init,
    end_time: init,
    patient_id: init,
    position_id: init,
    scanning_id: init
  }
  var addScan = "insert into scanning set ?";
  var getMaxId = "select Max(scanning_id) as sid from scanning";
  var addHistory = "insert into history set ?";
  console.log(filename);
  fs.readFile(req.files.image.path, function(err,data){
    if(err) console.log("Read File Error! " + err);
    var path = __dirname+'/public/images/' + filename;
    fs.writeFile(path,data,function(err){
      if(err) console.log(err);
      post.image_url = '/images/'+filename;
      post.patient_id = req.cookies.patientId;
      post.position_id = req.body.circleId;
      post.clinical_note = req.body.dialogscannote;
      connection.query(addScan,post,function(err, result) {
        connection.query(getMaxId,function(err, maxId) {
          var currentTime = new Date();
          var SEtime = [currentTime.getFullYear()+"", currentTime.getMonth()+1+"", currentTime.getDate()+""].join("-");
          postHistory.start_time = SEtime;
          postHistory.end_time = SEtime;
          postHistory.position_id = req.body.circleId;
          postHistory.patient_id = req.cookies.patientId;
          postHistory.scanning_id = maxId[0].sid;
          connection.query(addHistory,postHistory,function(err,results) {
            res.redirect('/together/together');
          });
        });
      });
    });
  });
});

app.get("/specific/type=:type/position=:id",function(req, res) {
  var getSpecificElement = "select * from " + req.params.type + " where " + req.params.type +"_id =" + req.params.id;

  connection.query(getSpecificElement, function(err, results){
    if(err) console.log(err);
    if(req.params.type == "diagnosis"){
      var post = {
        Type: req.params.type,
        Patient_id: results[0].patient_id,
        Position_id:results[0].position_doctor_id,
        ICD_id: results[0].ICD_id,
        Severity: results[0].severity,
        Symptom: results[0].symptom,
        Clinical_note: results[0].clinical_note,
        Start_time : results[0].start_time
      };
      res.send(post);
    }
    if(req.params.type == "treatment"){
      var post = {
        Type: req.params.type,
        Patient_id: results[0].patient_id,
        Position_id:results[0].position_doctor_id,
        Treatment_name: results[0].treatment_name,
        Clinical_note: results[0].clinical_note,
        Start_time : results[0].start_time
      };
      res.send(post);
    }
    if(req.params.type == "medication"){
      var post = {
        Type: req.params.type,
        Patient_id: results[0].patient_id,
        Position_id:results[0].position_doctor_id,
        Medication_name: results[0].drug_name,
        Dosage: results[0].dosage,
        Frequency: results[0].frequency,
        Clinical_note: results[0].clinical_note,
        Start_time : results[0].start_time
      };
      res.send(post);
    }
    if(req.params.type == "bloodtest"){
      var post = {
        Type: req.params.type,
        Patient_id: results[0].patient_id,
        Clinical_note: results[0].clinical_note,
        Start_time : results[0].start_time
      };
      res.send(post);
    }
    if(req.params.type == "scanning"){
      var post = {
        Type: req.params.type,
        Position_id: results[0].position_doctor_id,
        Image_Url: results[0].image_url,
        Patient_id: results[0].patient_id,
        Clinical_note: results[0].clinical_note,
        Start_time : results[0].start_time
      };
      res.send(post);
    }
  });
}); 

app.get('/detail/type=:type/position=:id',function(req,res){
  var getDetail = "select * from " + req.params.type + " where position_doctor_id = " + req.params.id + "  and  patient_id= 1"  ;
  connection.query(getDetail,function(err,result){
    if(err) console.log(err);
    if(result.length != 0){
      var lastone;
      for(var i in result){
        lastone = result[i];
      }
      if(req.params.type == "diagnosis") {
        var back = {
          ICD_id: lastone.ICD_id,
          Severity: lastone.severity,
          Symptom: lastone.symptom,
          Clinical_note: lastone.clinical_note
        };
        res.send(back);
      }

      if(req.params.type == "treatment") {
        var back = {
          Treatment_name: lastone.treatment_name,
          Clinical_note: lastone.clinical_note
        };
        res.send(back);
      }

      if(req.params.type == "medication") {
        var back = {
          Medication_name: lastone.drug_name,
          Dosage: lastone.dosage,
          Frequency: lastone.frequency,
          Clinical_note: lastone.clinical_note
        };
        res.send(back);
      }

      if(req.params.type == "scanning") {
        var back = {
          Image_url: lastone.image_url,
          Clinical_note: lastone.clinical_note
        };
        res.send(back);
      }
    }else{
      res.redirect('/together/together');
    }
  });
});// show latest diagnosis

app.get('/bloodTest', function(req, res) {
  res.render('bloodTest');
});

/********************************************/
app.post('/SelfDiagnosisPost',function(req,res){
  var addDiagnosis = "insert into p_diagnosis set ?";
 // var getMaxId = "select Max(diagnosis_id) as tid from diagnosis";
 // var addHistory = "insert into history set ?";
  var postDiagnosis = {
    severity: req.body.SelfDialogdiagnosisseverity,
    symptom: req.body.SelfDialogdiagnosissymptom,
    clinical_note: req.body.
        SelfDialogdiagnosisnote,
    start_time:req.body.SelfDialogdiagnosisstart_time,
    end_time:req.body.SelfDialogdiagnosisend_time,
    d_position_id: req.body.circleId,
    patient_id: 1,
    doctor_id:1
  };
  connection.query(addDiagnosis, postDiagnosis, function(err,result) {
    if(err) console.log(err);
    console.log(result);

    res.redirect('/PHR/PHR');
  });
}); // add Self diagnosis

app.post('/SelfSymptomPost',function(req,res){
  var addSymptom = "insert into symptom set ?";
  // var getMaxId = "select Max(diagnosis_id) as tid from diagnosis";
  // var addHistory = "insert into history set ?";
  var postSymptom = {
    severity: req.body.SelfDialogsymptomseverity,
    symptom: req.body.SelfDialogsymptomsymptom,
    start_time:req.body.SelfDialogsymptomstart_time,
    end_time:req.body.SelfDialogsymptomend_time,
    s_position_id: req.body.s_circleId,
    patient_id: 1,
    doctor_id:1
  };
  connection.query(addSymptom, postSymptom, function(err,result) {
    if(err) console.log(err);
    console.log(result);

    res.redirect('/PHR/PHR');
  });
}); // add  Self symptom

app.post('/SelfSymptomHealingTimePost',function(req,res){
  var addSymptom = "update symptom set ? where s_position_id = " + req.body.s_circleId ;
  // var getMaxId = "select Max(diagnosis_id) as tid from diagnosis";
  var addSymptomHistory = "insert into symptom_history set ?";
  var postSymptom = {

    healing_time:req.body.SelfDialogsymptomhealing_time
  };
  connection.query(addSymptom, postSymptom, function(err,result) {

    var getSymptom = "select position_doctor.position_doctor_id ,symptom.start_time, symptom.healing_time, symptom.symptom, symptom.patient_id,symptom.doctor_id, symptom.s_position_id "+
        "from position_doctor,symptom "+
        "where symptom.s_position_id = position_doctor.s_position_id " +
        "and symptom.s_position_id = "+ req.body.s_circleId ;
console.log(getSymptom);
    connection.query(getSymptom,function(err,results){

      console.log(results);
      for (var i in results) {
      var s_start_time = results[i].start_time;
      var s_healing_time = results[i].healing_time;
      var symptom = results[i].symptom;
      var patient_id = results[i].patient_id;
      var doctor_id = results[i].doctor_id;
      var position_doctor_id = results[i].position_doctor_id;
      var s_position_id = results[i].s_position_id;
        postSymptom2={
          s_start_time :s_start_time,
          s_healing_time : s_healing_time,
          symptom: symptom,
          patient_id : patient_id,
          doctor_id : doctor_id,
          position_doctor_id :position_doctor_id,
          s_position_id :s_position_id
        };
      }
      console.log(s_start_time);


      connection.query(addSymptomHistory,postSymptom2,function(err,results){
      //  if(err) console.log(err);
        console.log(results);
        res.redirect('/PHR/PHR');

      });
    });
    
  });
}); // add  Self symptom
app.post('/majorDiseasePost',function(req,res){
  var addMajorDiagnosis = "insert into major_disease set ?";

  var postMajorDiagnosis = {
    type: req.body.majordiagnosistype,
    severity: req.body.majordiagnosisseverity,
    symptom: req.body.majordiagnosissymptom,
    start_time:req.body.majordiagnosisstart_time,
    position_doctor_id: req.body.major_position_doctor_id,
    disease_name: req.body.majordiseasename,
    patient_id: 1,
    doctor_id:1
  };
  connection.query(addMajorDiagnosis, postMajorDiagnosis, function(err,result) {
    if(err) console.log(err);
    console.log(result);

    res.redirect('/history/type=MajorDisease/position=0');
  });
});


app.post('/SymptomPositionPost',function(req,res){
  var updatePosition = "update position_doctor set ? where position_doctor_id = " + req.body.doctor_circleId ;
  // var getMaxId = "select Max(diagnosis_id) as tid from diagnosis";
  // var addHistory = "insert into history set ?";
  var postSymptom = {
    s_position_id: req.body.dialogSymptom_id

  };
  connection.query(updatePosition, postSymptom, function(err,result) {
    if(err) console.log(err);
    console.log(result);

    res.redirect('/together/together');
  });
}); // add  Self symptom

app.post('/PHR', function(req, res) {
  var s_d = req.body.select;
  var post = {
    position_x : req.body.form_x,
    position_y : req.body.form_y,
    patient_id: 1,
    doctor_id:1
  };

  if(s_d =="symptom"){
    var sql = 'insert into s_position set ?';
    var sql_max_id = 'select MAX(s_position_id) as poid from s_position';
    var sql_symptom = 'insert into symptom set ?';

    connection.query(sql, post,function(err, result) {
      console.log(result);

      connection.query(sql_max_id,function(err,maxId,fields) {
        var postSymptom = {
          s_position_id:maxId[0].poid,
          patient_id: 1,
          doctor_id: 1
        };

        connection.query(sql_symptom, postSymptom, function (err, symptom) {
          if (err) console.log(err);
          res.redirect('/PHR/PHR');

        });
      });

    });
  }
  if(s_d =="diagnosis"){
    var sql = 'insert into d_position set ?';
    var sql_max_id = 'select MAX(d_position_id) as poid from d_position';
    var sql_diagnosis = 'insert into p_diagnosis set ?';
    connection.query(sql, post,function(err, result) {
      connection.query(sql_max_id,function(err,maxId,fields) {
        var postDiagnosis = {
          d_position_id: maxId[0].poid,
          patient_id: 1,
          doctor_id: 1
        };
        connection.query(sql_diagnosis, postDiagnosis, function (err, diagnosis) {
          if (err) console.log(err);
          res.redirect('/PHR/PHR');

        });
      });
      });
  }
});

app.get('/PHR/PHR', function(req, res) {
  var init = [];
  var post = {
    d_position :init,
    s_position: init,
    position_doctor: init,
    selectedPatient: init,
    patients : init,
    bodyCategory:"together"
   
  };

  var getAllPatients = "select * from patient";
  connection.query(getAllPatients,function(err, allPatients) {
    post.patients = allPatients;
    if (req.cookies.patientId) {
      post.hasCookie = true;
      post.selectedPatient = req.cookies.patientId;
      var getDPositions = 'select d_position.position_x,d_position.position_y,' +
          'p_diagnosis.diagnosis_id,d_position.d_position_id,' +
          'p_diagnosis.symptom,p_diagnosis.severity, ' +
          'p_diagnosis.start_time,p_diagnosis.end_time, ' +
          'p_diagnosis.clinical_note ' +
          ' from d_position,p_diagnosis ' +
          'WHERE d_position.d_position_id = p_diagnosis.d_position_id ' +
          'AND d_position.patient_id = p_diagnosis.patient_id ' +
          'AND d_position.doctor_id = p_diagnosis.doctor_id ' +
          'AND d_position.patient_id =1 ' +
          'AND d_position.doctor_id = 1';


      getDPositions = getDPositions + " order by p_diagnosis.diagnosis_id ASC";
      // console.log(getPositions);
      var getSPositions = 'select s_position.position_x,s_position.position_y,' +
          'symptom.symptom_id,s_position.s_position_id,' +
          'symptom.symptom,symptom.severity ,' +
          'symptom.start_time,symptom.end_time' +
          ' from s_position,symptom ' +
          'WHERE s_position.s_position_id = symptom.s_position_id ' +
          'AND s_position.patient_id = symptom.patient_id ' +
          'AND s_position.doctor_id = symptom.doctor_id ' +
          'AND s_position.patient_id =1 ' +
          'AND s_position.doctor_id = 1';

      // console.log(getSPositions);
      getSPositions = getSPositions + " order by symptom.symptom_id ASC";

      var getPositions = 'select position_doctor.position_x,position_doctor.position_y,' +
          'diagnosis.diagnosis_id, diagnosis.severity,diagnosis.start_time, ' +
          'diagnosis.ICD_id,diagnosis.symptom,position_doctor.disease_type,' +
          'position_doctor.position_doctor_id ' +
          'from diagnosis,position_doctor ' +
          'where diagnosis.position_doctor_id=position_doctor.position_doctor_id ' +
          'and diagnosis.patient_id=position_doctor.patient_id ' +
          'and diagnosis.doctor_id=position_doctor.doctor_id ' +
          'and position_doctor.doctor_id = 1 ' +
          'and position_doctor.patient_id=1 ';


      connection.query(getDPositions, function (err, allPositions) {
        var map = {};
        for (var i in allPositions) {
          map[' ' + allPositions[i].d_position_id] = allPositions[i];
        }
        var filteredPositions2 = [];
        for (var y in map) {
          filteredPositions2.push(map[y]);
        }
        // console.log(filteredPositions);
        post.d_position = filteredPositions2;
        // res.render('PHR', post);

      });
      connection.query(getSPositions, function (err, allSPositions) {
        var map1 = {};
        for (var i in allSPositions) {
          map1[' ' + allSPositions[i].s_position_id] = allSPositions[i];
        }
        var filteredPositions1 = [];
        for (var y in map1) {
          filteredPositions1.push(map1[y]);
        }

        post.s_position = filteredPositions1;
        // res.render('PHR', post);

      });
      connection.query(getPositions, function (err, allPositions) {
        // console.log(allPositions);
        var map = {};
        for (var i in allPositions) {
          map['' + allPositions[i].position_doctor_id] = allPositions[i];
        }
        var filteredPositions = [];
        for (var y in map) {
          filteredPositions.push(map[y]);
        }
        post.position_doctor = filteredPositions;
        res.render('PHR', post);
      });

    }
  });

});

app.get('/PHR/:bodyPosition', function(req, res) {
  var init = [];
  var post = {
    selectedPatient: init,
    patients : init,
    position_doctor : init,
    s_position: init,
    d_position: init,
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
      var getPositions = 'select position_doctor.position_x,position_doctor.position_y,' +
          'diagnosis.diagnosis_id, diagnosis.severity, ' +
          'diagnosis.ICD_id,diagnosis.symptom,position_doctor.disease_type,' +
          'position_doctor.position_doctor_id ' +
          'from diagnosis,position_doctor ' +
          'where diagnosis.position_doctor_id=position_doctor.position_doctor_id ' +
          'and diagnosis.patient_id=position_doctor.patient_id ' +
          'and diagnosis.doctor_id=position_doctor.doctor_id ' +
          'and position_doctor.doctor_id = 1 ' +
          'and position_doctor.patient_id= 1';
      //console.log(getPositions);
      /* var getSPositions='select s_position.position_x,s_position.position_y,'+
       'symptom.symptom_id,s_position.s_position_id,'+
       'symptom.symptom,symptom.severity ,'+
       'symptom.start_time,symptom.end_time'+
       ' from s_position,symptom '+
       'WHERE s_position.s_position_id = symptom.s_position_id '+
       'AND s_position.patient_id = symptom.patient_id ' +
       'AND s_position.doctor_id = symptom.doctor_id ' +
       'AND s_position.patient_id =1 ' +
       'AND s_position.doctor_id = 1';

       // console.log(getSPositions);
       getSPositions = getSPositions + " order by symptom.symptom_id ASC";

       var getDPositions='select d_position.position_x,d_position.position_y,'+
       'p_diagnosis.diagnosis_id,d_position.d_position_id,'+
       'p_diagnosis.symptom,p_diagnosis.severity, '+
       'p_diagnosis.start_time,p_diagnosis.end_time, '+
       'p_diagnosis.clinical_note '+
       ' from d_position,p_diagnosis '+
       'WHERE d_position.d_position_id = p_diagnosis.d_position_id '+
       'AND d_position.patient_id = p_diagnosis.patient_id ' +
       'AND d_position.doctor_id = p_diagnosis.doctor_id ' +
       'AND d_position.patient_id =1 ' +
       'AND d_position.doctor_id = 1';


       getDPositions = getDPositions + " order by p_diagnosis.diagnosis_id ASC";

       connection.query(getSPositions, function(err, allSPositions){
       var map1 = {};
       for(var i in allSPositions) {
       map1[' ' +  allSPositions[i].s_position_id] = allSPositions[i];
       }
       var filteredPositions1 = [];
       for(var y in map1) {
       filteredPositions1.push(map1[y]);
       }

       post.s_position = filteredPositions1;

       });

       connection.query(getDPositions, function(err, allPositions){
       var map = {};
       for(var i in allPositions) {
       map[' ' +  allPositions[i].d_position_id] = allPositions[i];
       }
       var filteredPositions2 = [];
       for(var y in map) {
       filteredPositions2.push(map[y]);
       }
       // console.log(filteredPositions);
       post.d_position = filteredPositions2;
       // res.render('PHR', post);

       });
       */

      if (bodyPart != 'PHR') {
        getPositions = getPositions + ' and position_doctor.disease_type = \"' + bodyPart + '\"';
        console.log(getPositions);
      }
      getPositions = getPositions + " order by diagnosis.diagnosis_id ASC";
      connection.query(getPositions, function (err, allPositions) {
        // console.log(allPositions);
        var map = {};
        for (var i in allPositions) {
          map['' + allPositions[i].position_doctor_id] = allPositions[i];
        }
        var filteredPositions = [];
        for (var y in map) {
          filteredPositions.push(map[y]);
        }
        post.position_doctor = filteredPositions;
        res.render('PHR', post);
      });

    }
  });
});

app.get('/PHR/history/type=:type/position=:id',function(req,res){
  var getAllHistory = "select position_doctor.disease_type, history.* from position_doctor, history "+
      " where history.position_doctor_id = position_doctor.position_doctor_id and history.doctor_id = 1 and history.patient_id = " + req.cookies.patientId;
  var init ="";
  var postArray = [];
  var postArray2=[];
  var getSymptomHistory = "select * from symptom_history "+
      " where symptom_history.doctor_id = 1 and symptom_history.patient_id = " + req.cookies.patientId;



  var id = req.params.id;
  var type = req.params.type;

  //var bodySystem = "select position.disease_type from history, position" + "where hisotry.position_id = position.position_id";

  if(isNaN(id)) {
    getAllHistory = "select position_doctor.disease_type, history.* from history, position_doctor" +
        " where history.position_doctor_id = position_doctor.position_doctor_id and history.doctor_id = 1 and history.patient_id = " + req.cookies.patientId +
        " and position_doctor.disease_type= '" + id +"'";

    var getSymptomHistory = "select symptom_history.* from symptom_history "+
        " where symptom_history.doctor_id = 1 and symptom_history.patient_id = " + req.cookies.patientId +
        " and symptom_history.position_doctor_id = (select position_doctor_id from position_doctor where position_doctor.disease_type= '" + id +"')";

    /* getSymptom ="select diagnosis.symptom from diagnosis "+
     " where patient_id = " + req.cookies.patientId; */
  } else {
    if(id != 0) {
      getAllHistory = getAllHistory + " and history.position_doctor_id = " + id;
      getSymptomHistory = getSymptomHistory +" and symptom_history.position_doctor_id = " + id;


    }
  }
  connection.query(getSymptomHistory,function(err,results){

    // console.log(results);
    for (var i in results) {
      var post2 = {
        s_start_time: init,
        s_healing_time : init,
        symptom: init
      };
      htime = results[i].s_start_time;
      etime =results[i].s_healing_time;
      post2.symptom = results[i].symptom;
      post2.s_start_time = [htime.getFullYear() + "", htime.getMonth() + "", htime.getDate() + ""].join(",");
      post2.s_healing_time = [etime.getFullYear() + "", etime.getMonth() + "", etime.getDate() + ""].join(",");
      postArray2.push(post2);
    }

  });
  connection.query(getAllHistory,function(err, results){
    if(err) console.log(err);
    if(type == "all") {
      for (var i in results) {
        var post = {
          starttime: init,
          endtime: init,
          content: init,
          contenttype:init,
          disease_type:init,
          id : init,
          position_id: init
        };
        post.disease_type = results[i].disease_type;
        post.contenttype = results[i].contenttype;
        post.position_id = results[i].position_id;
        var htime = results[i].start_time;
        var etime = results[i].end_time;
        var tempContent = "";
        post.starttime = [htime.getFullYear() + "", htime.getMonth() + "", htime.getDate() + ""].join(",");
        post.endtime = [etime.getFullYear() + "", etime.getMonth() + "", etime.getDate() + ""].join(",");

        if (results[i].diagnosis_id) {
          post.contenttype = 'diagnosis';
          post.id = results[i].diagnosis_id;
          tempContent = tempContent + "/images/diagnosis.jpg";
        }
        if (results[i].treatment_id) {
          post.contenttype = 'treatment';
          post.id = results[i].treatment_id;
          tempContent = tempContent + "/images/treatment.jpg";
        }
        if (results[i].medication_id) {
          post.contenttype = 'medication';
          post.id = results[i].medication_id;
          tempContent = tempContent + "/images/medication.jpg";
        }
        if (results[i].bloodtest_id) {
          post.contenttype = 'bloodtest';
          post.id = results[i].bloodtest_id;
          tempContent = tempContent + "/images/bloodtest.jpg";
        }
        if (results[i].scanning_id) {
          post.contenttype = 'scanning';
          post.id = results[i].scanning_id;
          tempContent = tempContent + "/images/scanning.jpg";
        }
        post.content = tempContent;
        postArray.push(post);
      }
    } else {
      var typeName = type+"_id";
      for (var i in results) {
        var post = {
          starttime: init,
          endtime: init,
          content: init,
          contenttype : type,
          disease_type : init,
          id: init
        };

        post.disease_type = results[i].disease_type;

        var htime = results[i].start_time;
        var etime = results[i].end_time;
        var tempContent = "";
        post.starttime = [htime.getFullYear() + "", htime.getMonth() + "", htime.getDate() + ""].join(",");
        post.endtime = [etime.getFullYear() + "", etime.getMonth() + "", etime.getDate() + ""].join(",");
        if ((results[i])[typeName]) {
          post.id = (results[i])[typeName];
          tempContent = tempContent + "/images/"+type+".jpg";
        }
        post.content = tempContent;
        if(tempContent != "") {
          postArray.push(post);
        }
      }
    }

    res.render('history1',{allData: postArray,allData2:postArray2});
  });
});
/********************************************/
app.get('/', function (req, res) {
  var post ={
    name : 'karen'
  };
  res.render('test',post);
});


app.get('/PHR', function (req, res) {
  res.render('PHR');
});


module.exports = app;
