const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { valid } = require('../middlewares/vilidate.mdw');
const validUserSchema = require('../schemas/user.json');
const jwt = require('jsonwebtoken');
const authMiddewares = require('../middlewares/auth.mdw');
const Response = require('../jsonResponse/jsonResponse');
const chatbotController = require("../controllers/chatbotController");

//connect to mongodb
let mongoose = require('mongoose');
const jsonResponse = require('../jsonResponse/jsonResponse');
// mongoose.connect('mongodb://master:worker@cluster0-shard-00-00.shiaf.mongodb.net:27017,cluster0-shard-00-01.shiaf.mongodb.net:27017,cluster0-shard-00-02.shiaf.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-uj30is-shard-0&authSource=admin&retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect('mongodb+srv://master:worker@cluster0.shiaf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {useNewUrlParser: true,useUnifiedTopology: true });
//model
const courseSchema = new mongoose.Schema({
  stt: String,
  name: String,
  short_described: String,
  full_described: String,
  rating: Number,
  image_link: String,
  idTeacher: String,
  dateCourse: Date,
  isFinish: Boolean,
  view: Number,
  price: Number,
  category: String,
  review: [{ comment: String, id_user: mongoose.ObjectId, rate: Number,date:{type: Date, default: Date.now} }],
  feedBack: [{ type: String }]
});
const Course = mongoose.model('Course', courseSchema);

const userSchema = new mongoose.Schema({
  stt: String,
  fullname: String,
  username: String,
  password: String,
  phone: String,
  type: Number,
  gender: String,
  dob: Date,
  describe: String,
  level: String,
  email: String,
  watchlist: [String]
});
const User = mongoose.model('User', userSchema);

const videoSchema = new mongoose.Schema({
  name: String,
  id_course: String,
  link: String
});
const Video = mongoose.model('Video', videoSchema);

//lấy tất cả danh sách khóa học
router.get('/course/all', (req, res) => {
  Course.find({}).lean()
    .exec(function (error, docs) {
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(304).json(response);
      }
      else {
        let teacherId = [];
        for (let i = 0; i < docs.length; i++) {
          teacherId.push(docs[i].idTeacher);
        }
        User.find({
          '_id': {
            $in: teacherId
          }
        }).select('fullname').exec(function (err, teachersName) {
          for (let i = 0; i < docs.length; i++) {
            for (let j = 0; j < teachersName.length; j++) {
              if (docs[i].idTeacher == teachersName[j]._id) {
                docs[i].nameTeacher = teachersName[j].fullname;
                break;
              }
            }
          }
          const response = Response.successResponse(docs);
          return res.status(200).json(response);
        });
      }
    });
});

router.get('/course/top-10-view', (req, res) => {
  Course.find({})
    .sort({ view: -1 })// sắp xếp giảm dần theo view
    .limit(10)// lấy nhiều nhất 10 item
    .lean()
    .exec(function (error, docs) {
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(304).json(response);
      }
      else {
        let teacherId = [];
        for (let i = 0; i < docs.length; i++) {
          teacherId.push(docs[i].idTeacher);
        }
        User.find({
          '_id': {
            $in: teacherId
          }
        }).select('fullname').exec(function (err, teachersName) {
          for (let i = 0; i < docs.length; i++) {
            for (let j = 0; j < teachersName.length; j++) {
              if (docs[i].idTeacher == teachersName[j]._id) {
                docs[i].nameTeacher = teachersName[j].fullname;
                break;
              }
            }
          }
          const response = Response.successResponse(docs);
          return res.status(200).json(response);
        });
      }
    });
});

router.get('/course/top-10-date-create', (req, res) => {
  Course.find({})
    .sort({ dateCourse: -1 })// sắp xếp giảm dần theo thời gian
    .limit(10)// lấy nhiều nhất 10 item
    .lean()
    .exec(function (error, docs) {
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(304).json(response);
      }
      else {
        let teacherId = [];
        for (let i = 0; i < docs.length; i++) {
          teacherId.push(docs[i].idTeacher);
        }
        User.find({
          '_id': {
            $in: teacherId
          }
        }).select('fullname').exec(function (err, teachersName) {
          console.log(teachersName);
          for (let i = 0; i < docs.length; i++) {
            for (let j = 0; j < teachersName.length; j++) {
              if (docs[i].idTeacher == teachersName[j]._id) {
                docs[i].nameTeacher = teachersName[j].fullname;
                break;
              }
            }
          }
          const response = Response.successResponse(docs);
          return res.status(200).json(response);
        });
      }
    });
});


router.get('/course/detail/:id', (req, res) => {
  Course.findOne({ _id: req.params.id })
    .lean()
    .exec(function (error, doc) {
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(304).json(response);
      }
      else {
        if (doc) {
          //tim video voi course do
          Video.find({ id_course: doc._id }, (err, videos) => {
            doc.video = videos;
            //tim User đã comment
            let arrUserComment = [];
            for (let i = 0; i < doc.review.length; i++) {
              arrUserComment.push(doc.review[i].id_user);
            }
            User.find({
              '_id': {
                $in: arrUserComment
              }
            }).lean().exec(function (err, UsersComment) {
              for (let i = 0; i < doc.review.length; i++) {
                for (let j = 0; j < UsersComment.length; j++) {
                  if (doc.review[i].id_user.equals(UsersComment[j]._id)) {
                    doc.review[i].fullname = UsersComment[j].fullname;
                    break;
                  }
                }
              }
              const response = Response.successResponse(doc);
              return res.status(200).json(response);
            });
          });
        }
        else {
          const response = Response.falseResponse('No item with provided id');
          return res.status(304).json(response);
        }
      }
    });
});

router.post('/user/register', valid(validUserSchema), (req, res) => {
  const newuser = new User(req.body);
  User.findOne({ username: newuser.username })
    .exec(function (error, doc) {
      console.log(error);
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(304).json(response);
      }
      else {
        if (doc) {
          const response = Response.falseResponse('User already exists');
          return res.status(200).json(response);
        }
        else {
          newuser.password = bcrypt.hashSync(newuser.password, 10);
          newuser.save();
          const user = newuser.toObject();
          delete user.password;
          const response = Response.successResponse(user);
          return res.status(200).json(response);
        }
      }
    });
});

router.post('/user/login', (req, res) => {
  const user = req.body;
  User.findOne({ username: user.username })
    .exec(function (error, doc) {
      console.log(error);
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(200).json(response);
      }
      else {
        if (doc) {

          if (!bcrypt.compareSync(user.password, doc.password)) {
            return res.json({
              authenticated: false
            });
          }

          const payload = {
            id: doc.id,
            type: doc.type
          };

          console.log(payload);

          const opts = {
            expiresIn: 36000
          };

          const accessToken = jwt.sign(payload, 'WEDNC2021', opts);

          const data = {
            authenticated: true,
            accessToken: accessToken
          };

          const response = Response.successResponse(data);
          return res.status(200).json(response);
        }
        else {
          const response = Response.falseResponse('User not exists');
          return res.status(200).json(response);
        }
      }
    });
});

router.get('/user/info', authMiddewares, (req, res) => {

  User.findOne({ _id: req.user.id })
    .exec(function (error, doc) {
      console.log(error);
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(200).json(response);
      }
      else {

        if (doc) {
          doc = doc.toObject();
          delete doc.password;
          const response = Response.successResponse(doc);
          return res.status(200).json(response);
        }
        else {
          const response = Response.falseResponse('User not exists');
          return res.status(200).json(response);
        }
      }
    });
});

router.put('/user/info', authMiddewares, (req, res) => {
  User.findOne({ _id: req.user.id })
    .exec(function (error, doc) {
      console.log(error);
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(200).json(response);
      }
      else {
        if (doc) {
          doc.fullname = req.body.fullname;
          doc.phone = req.body.phone;
          doc.gender = req.body.gender;
          doc.dob = req.body.dob;
          doc.describe = req.body.describe;
          doc.level = req.body.level;
          doc.email = req.body.email;
          doc.save();

          doc = doc.toObject();
          delete doc.password;
          const response = Response.successResponse(doc);
          return res.status(200).json(response);
        }
        else {
          const response = Response.falseResponse('User not exists');
          return res.status(200).json(response);
        }
      }
    });
});

router.put('/user/password', authMiddewares, (req, res) => {
  User.findOne({ _id: req.user.id })
    .exec(function (error, doc) {
      console.log(error);
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(200).json(response);
      }
      else {
        if (doc) {

          if (!bcrypt.compareSync(req.body.password, doc.password)) {
            const response = Response.falseResponse('Incorrect password');
            return res.status(200).json(response);
          }

          doc.password = bcrypt.hashSync(req.body.newpassword, 10);
          doc.save();

          const response = Response.successResponse({ message: 'Change password successfully' });
          return res.status(200).json(response);

        }
        else {
          const response = Response.falseResponse('User not exists');
          return res.status(200).json(response);
        }
      }
    });
});

router.post('/user/watchlist', authMiddewares, (req, res) => {
  course = req.body.course;
  User.findOne({ _id: req.user.id })
    .exec(function (error, doc) {
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(200).json(response);
      }
      else {
        if (doc) {
          if(doc.watchlist.indexOf(course) > -1) {
            doc.watchlist.pull(course);
          }
          else doc.watchlist.push(course);
          doc.save();
          const response = Response.successResponse(doc);
          return res.status(200).json(response);
        }
        else {
          const response = Response.falseResponse('User not exists');
          return res.status(200).json(response);
        }
      }
    });
})

router.get('/user/watchlist', authMiddewares, (req, res) => {
  User.findOne({ _id: req.user.id })
    .lean()
    .exec(function (error, doc) {
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(200).json(response);
      }
      else {
        if (doc) {

          Course.find({
            '_id': {
              $in: doc.watchlist
            }
          },
          '_id name rating image_link dateCourse isFinish view price category idTeacher')
          .lean()
          .exec(function (error, watchlist) {
            let teacherId = [];
            for (let i = 0; i < watchlist.length; i++) {
              teacherId.push(watchlist[i].idTeacher);
            }
            User.find({
              '_id': {
                $in: teacherId
              }
            }).select('fullname').exec(function (err, teachersName) {
              for (let i = 0; i < watchlist.length; i++) {
                for (let j = 0; j < teachersName.length; j++) {
                  if (watchlist[i].idTeacher == teachersName[j]._id) {
                    watchlist[i].nameTeacher = teachersName[j].fullname;
                    break;
                  }
                }
              }
              const response = Response.successResponse(watchlist);
              return res.status(200).json(response);
            });
          });
        }
        else {

          const response = Response.falseResponse('User not exists');
          return res.status(200).json(response);
        }
      }
    });
});

router.post('/review/:idCourse', authMiddewares,(req,res)=>{
  User.findOne({ _id: req.user.id })
    .lean()
    .exec(function (error, doc) {
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(200).json(response);
      }
      else {
        if (doc) {
          Course.findOne({_id:req.params.idCourse}).lean().exec((err,course)=>{
            if(course){
              let reviewObject={
                conmment:req.body.comment,
                rate:parseInt(req.body.rate),
                id_user:req.user.id
              }
              course.review.push(reviewObject);
              course.save();
              reviewObject.fullname=doc.fullname;
              return res.status(200).json(reviewObject);
            }else{
              return res.json({success:'fail',error:'không tìm thấy course với id'})
            }
          })
        }
        else {

          const response = Response.falseResponse('User not exists');
          return res.status(200).json(response);
        }
      }
    });
})

router.get('/user/all', authMiddewares,(req,res)=>{
  if (req.user.type !== 1) {
    const response = Response.falseResponse('User has no permissions');
    return res.status(200).json(response);
  }
  User.findOne({ _id: req.user.id })
    .lean()
    .exec(function (error, doc) {
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(200).json(response);
      }
      else {
        if (doc) {
          User.find({},
            '_id fullname username phone type gender dob email')
            .lean()
            .exec((err,user)=>{

              const response = Response.successResponse(user);
              return res.status(200).json(response);
          })
        }
        else {

          const response = Response.falseResponse('User not exists');
          return res.status(200).json(response);
        }
      }
    });
})

router.delete('/user', authMiddewares, (req, res) => {
  if (req.user.type !== 1) {
    const response = Response.falseResponse('User has no permissions');
    return res.status(200).json(response);
  }
  User.findOne({ _id: req.user.id })
    .lean()
    .exec(function (error, doc) {
      if (error) {
        const response = Response.falseResponse(error);
        return res.status(200).json(response);
      }
      else {
        if (doc) {
          User.deleteOne({_id: req.body.id})
            .exec((err,user)=>{
              const response = Response.successResponse({msg: "Delete success"});
              return res.status(200).json(response);
          })
        }
        else {

          const response = Response.falseResponse('User not exists');
          return res.status(200).json(response);
        }
      }
    });
});

module.exports = router;
