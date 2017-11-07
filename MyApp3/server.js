var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();
var mysql = require('mysql');
var fs = require('fs');
var multer = require('multer');

var connection = mysql.createConnection({
	host:'localhost',
	user:'root',
	password:'root',
	database:'thesis',
	multipleStatements: true
});

connection.connect(function(err){});

app.use(express.static('public'));
app.use(multer({ dest: __dirname +'/new/'}));
//app.use(multer({dest:'/public/images/'}));
app.use(bodyParser());
app.use(cookieParser());
require('./routes/main')(app);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

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

});

app.post('/together', function(req, res) {
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

app.get('/together/:bodyPosition', function(req, res) {
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

app.get('/history/type=:type/position=:id',function(req,res){
	var getAllHistory = "select position.disease_type, history.* from position, history "+
		" where history.position_id = position.position_id and history.patient_id = " + req.cookies.patientId;
	var init ="";
	var postArray = [];

	//var getSymptom ="select diagnosis.symptom, history.* from diagnosis, history  "+
		" where  history.position_id = diagnosis.position_id and patient_id = " + req.cookies.patientId;

	var id = req.params.id;
	var type = req.params.type;

	//var bodySystem = "select position.disease_type from history, position" + "where hisotry.position_id = position.position_id";

	if(isNaN(id)) {
		getAllHistory = "select position.disease_type, history.* from history, position" +
			" where history.position_id = position.position_id and history.patient_id = " + req.cookies.patientId +
			" and position.disease_type= '" + id +"'";
		/* getSymptom ="select diagnosis.symptom from diagnosis "+
			" where patient_id = " + req.cookies.patientId; */
	} else {
		if(id != 0) {
			getAllHistory = getAllHistory + " and history.position_id = " + id;
			/*getSymptom ="select diagnosis.symptom from diagnosis "+
				" where patient_id = " + req.cookies.patientId; */

		}
	}

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

		res.render('history',{allData: postArray});
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
		clinical_note: req.body.
			dialogdiagnosisnote,
		position_id: req.body.circleId,
		patient_id: req.cookies.patientId
	};
	connection.query(addDiagnosis, postDiagnosis, function(err,result) {
		if(err) console.log(err);
		console.log(result);
		connection.query(getMaxId,function(err, maxId){
			var currentTime = new Date();
			var SEtime = [currentTime.getFullYear()+"", currentTime.getMonth()+1+"", currentTime.getDate()+""].join("-");
			var diagnosisId = maxId[0].tid;
			var postHistory ={
				patient_id: req.cookies.patientId,
				position_id: req.body.circleId,
				diagnosis_id: diagnosisId,
				start_time:SEtime,
				end_time:SEtime
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
		position_id: req.body.circleId,
		treatment_name: req.body.dialogtreatmentname,
		clinical_note: req.body.dialogtreatmentnote
	};
	connection.query(addTreatment,postTreatment,function(err, result) {
		if(err) console.log(err);
		console.log(result);
		connection.query(getMaxId,function(err, maxId){
			var currentTime = new Date();
			var SEtime = [currentTime.getFullYear()+"", currentTime.getMonth()+1+"", currentTime.getDate()+""].join("-");
			var treatmentId = maxId[0].tid;
			var postHistory ={
				patient_id: req.cookies.patientId,
				position_id: req.body.circleId,
				treatment_id: treatmentId,
				start_time:SEtime,
				end_time:SEtime
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
		position_id: req.body.circleId,
		drug_name: req.body.dialogmedicationname,
		dosage: req.body.dialogmedicationdosage,
		frequency: req.body.dialogmedicationfrequency,
		clinical_note: req.body.dialogmedicationtnote
	};
	console.log(req.body.circleId);
	console.log("Here");
	connection.query(addMedication,postMedication,function(err, result) {
		if(err) console.log(err);
		console.log(result);
		connection.query(getMaxId,function(err, maxId){
			var currentTime = new Date();
			var SEtime = [currentTime.getFullYear()+"", currentTime.getMonth()+1+"", currentTime.getDate()+""].join("-");
			var medicationId = maxId[0].tid;
			var postHistory ={
				patient_id: req.cookies.patientId,
				position_id: req.body.circleId,
				medication_id: medicationId,
				start_time:SEtime,
				end_time:SEtime
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
				Position_id:results[0].position_id,
				ICD_id: results[0].ICD_id,
				Severity: results[0].severity,
				Symptom: results[0].symptom,
				Clinical_note: results[0].clinical_note
			};
			res.send(post);
		}
		if(req.params.type == "treatment"){
			var post = {
				Type: req.params.type,
				Patient_id: results[0].patient_id,
				Position_id:results[0].position_id,
				Treatment_name: results[0].treatment_name,
				Clinical_note: results[0].clinical_note
			};
			res.send(post);
		}
		if(req.params.type == "medication"){
			var post = {
				Type: req.params.type,
				Patient_id: results[0].patient_id,
				Position_id:results[0].position_id,
				Medication_name: results[0].drug_name,
				Dosage: results[0].dosage,
				Frequency: results[0].frequency,
				Clinical_note: results[0].clinical_note
			};
			res.send(post);
		}
		if(req.params.type == "bloodtest"){
			var post = {
				Type: req.params.type,
				Patient_id: results[0].patient_id,
				Clinical_note: results[0].clinical_note
			};
			res.send(post);
		}
		if(req.params.type == "scanning"){
			var post = {
				Type: req.params.type,
				Position_id: results[0].position_id,
				Image_Url: results[0].image_url,
				Patient_id: results[0].patient_id,
				Clinical_note: results[0].clinical_note
			};
			res.send(post);
		}
	});
});

app.get('/detail/type=:type/position=:id',function(req,res){
	var getDetail = "select * from " + req.params.type + " where position_id = " + req.params.id + "  and  patient_id= " + req.cookies.patientId;
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
});

app.post('/cookiePost',function(req,res){
	var minute = 60*100000;
	if(req.body.patientID && req.body.patientID != ""){
		//console.log(req.body.patientID);
		res.cookie('patientId', req.body.patientID,{maxAge:minute});
	}
	res.redirect("/together/together");
});

app.get('/bloodTest', function(req, res) {
	res.render('bloodTest');
});


//new version
app.get('/Connection',function(req, res){
	res.render('Connection');
});
app.get('/Connection/:bodyPosition', function(req, res) {
	var init = [];
	var bodyPart = req.params.bodyPosition;
	var post = {
		selectedPatient: init,
		patients : init,
		position : init,
		hasCookie : init,
		bodyCategory: req.params.bodyPosition,
		pp : init
	};

	res.render('Connection', post);

});

//new version Sep.13
/********************************************/
app.get('/PHR',function(req,res){
	res.render('PHR');
});



/****************************************************/
var server = app.listen(3000, function(){
	console.log("Server is on Port 3000!");
});

