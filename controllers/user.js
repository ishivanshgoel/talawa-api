
const model = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Op = require('sequelize').Op;

exports.register_user = (req, res, next) => {
    model.User.findOne({ where: { email: req.body.email }, attributes: {exclude: ['password']} })
        .then(user => {
            if (user) {
                throw 'Email address already exists';
            }
        })
        .then(() => {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err) {
                    throw err
                }
                else {
                   return model.User.create({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        email: req.body.email,
                        password: hash
                    });
                }
            });
        })
        .then(doc => {
            return res.status(201).json({
                message: 'user successfully created'
            });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({
                error: err
            });
        });
}

exports.login_user = (req, res, next) => {
    model.User.findOne({ where: { email: req.body.email } })
        .then(user => {
            if (!user) {
                return res.status(404).json({
                    message: 'Auth failed'
                })

            }
            else {
                bcrypt.compare(req.body.password, user.dataValues.password, (err, result) => {
                    if (err) {
                        return res.status(404).json({
                            message: 'Auth failed'
                        });
                    }
                    if (result) {
                        var token = jwt.sign({
                            email: user.dataValues.email,
                            userId: user.dataValues._id
                        }, process.env.JWT_KEY,
                            {
                                expiresIn: "1h"
                            })
                        return res.status(200).json({
                            message: 'Auth successful',
                            token: token
                        })
                    }
                })
            }
        })
        .catch(err => {
            console.log(err);
        });
}

exports.fetchUsers = async (req, res, next) => {
    try{
        const users = await model.User.findAll({ attributes: {exclude: ['password']}});
        const response = {
            count: users.length,
            users: users.map(user => {
                return {
                    id: user.dataValues.id,
                    firstName: user.dataValues.firstName,
                    lastName: user.dataValues.lastName,
                    email: user.dataValues.email
                }
            })
        }
        res.status(200).json(response);
    }catch(err){
        console.log(err);
    }
}


exports.fetchUsersFilter = async (req, res, next) => {
    try{
        const users = await model.User.findAll({ where:{ id:{[Op.ne]: req.params.userId}}, attributes: {exclude: ['password']}});
        const response = {
            count: users.length,
            users: users.map(user => {
                return {
                    id: user.dataValues.id,
                    firstName: user.dataValues.firstName,
                    lastName: user.dataValues.lastName,
                    email: user.dataValues.email
                }
            })
        }
        res.status(200).json(response);
    }catch(err){
        console.log(err);
    }
}

exports.fetchUsersByActivity = async (req, res, next) => {
    try{
        const users = await model.User.findAll({ 
            include: {
                model: model.UserActivity, 
                where: {
                    activityId: req.params.activityId
                }
            }, 
            attributes: {
                exclude: ['password']
            }
        });
        const response = {
            count: users.length,
            users: users.map(user => {
                return {
                    id: user.dataValues.id,
                    firstName: user.dataValues.firstName,
                    lastName: user.dataValues.lastName,
                    email: user.dataValues.email
                }
            })
        }
        res.status(200).json(response);
    }catch(err){
        console.log(err);
    }
}

exports.fetchUser = async (req, res, next) => {
    try{
        const user = await model.User.findOne({ where: { id: req.params.userId }, attributes: {exclude: ['password']} });
        if(user)
            return res.status(200).json(doc);
        else
            throw 'User does not exist'
    }catch(err){
        console.log(err);

    }
}

exports.updateUser = (req, res, next) => {
    model.User.findOne({ where: { id: req.params.userId } })
        .then(user => {
            return user.update(req.body.updates);
        })
        .then(updatedUser => {
            res.status(200).json(updatedUser);
        })
        .catch(err => {
            console.log(err);
        })
}

exports.deleteUser = (req, res, next) => {
    model.User.destroy({ where: { id: req.params.userId } })
        .then(doc => {
            res.status(200).json();
        })
        .catch(err => {
            console.log(err);
        })
}