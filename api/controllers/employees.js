/**
 * Copyright 2010-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * This file is licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License. A copy of
 * the License is located at
 *
 * http://aws.amazon.com/apache2.0/
 *
 * This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

const AWS = require('../../helpers/aws');
const constants = require('../common/constants');
const responseHelper = require('../../helpers/response');
const uuid = require('uuid');

const dynamodb = new AWS.DynamoDB();
const S3 = new AWS.S3();

const createParams = {
  TableName: constants.TABLE_NAME,
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }, //Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'name', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' },
    { AttributeName: 'location', AttributeType: 'S' },
    { AttributeName: 'photo', AttributeType: 'S' },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10,
  },
};

exports.createTable = (req, res, next) => {
  try {
    dynamodb.createTable(createParams, function (err, data) {
      if (err) {
        res.status(500).json({
          error: {
            message: 'Unable to create table.',
            err: JSON.stringify(err),
          },
        });
      } else {
        res.status(200).json({
          success: {
            message: `Table ${createParams.TableName} successfully created.`,
            data: data,
          },
        });
      }
    });
  } catch (err) {
    console.log('Unexpected error!');
    res.status(500).json({
      error: {
        message: 'Unable to create table.',
        err: JSON.stringify(err),
      },
    });
  }
};

exports.getAll = (req, res, next) => {
  try {
    var scanParams = {
      TableName: constants.TABLE_NAME,
    };

    dynamodb.scan(scanParams, function (err, data) {
      if (err) {
        res.status(500).json(responseHelper.getErrorResponse(err));
      } else {
        const employees = data.Items.map((it) => ({
          id: it['id']?.S || '',
          name: it['name']?.S || 'No name provided',
          location: it['location']?.S || 'No location provided',
          photo: it['photo']?.S || '',
          email: it['email']?.S || 'No email provided',
        }));

        res.status(200).json(responseHelper.getSuccessResponse(employees));
      }
    });
  } catch (err) {
    console.log('Unexpected error!');
    res.status(500).json({
      error: {
        message: 'Unable to get employees.',
        err: err,
      },
    });
  }
};

exports.deleteEmployee = (req, res, next) => {
  try {
    var id = req.params['id'];
    var deleteParams = {
      TableName: constants.TABLE_NAME,
      Key: {
        id: {
          S: id,
        },
      },
    };
    dynamodb.deleteItem(deleteParams, function (err, data) {
      if (err) {
        res.status(500).json(responseHelper.getErrorResponse(err));
      } else {
        res.status(200).json(responseHelper.getSuccessResponse(data));
      }
    });
  } catch (err) {
    console.log('Unexpected error!');
    res.status(500).json({
      error: {
        message: 'Unable to get employees.',
        err: err,
      },
    });
  }
};

exports.addEmployee = (req, res, next) => {
  try {
    const id = uuid.v4();
    const name = req.body['name'];
    const email = req.body['email'];
    const location = req.body['location'];
    const photo = req.body['photo'];

    var addParams = {
      TableName: constants.TABLE_NAME,
      Item: {
        id: {
          S: id,
        },
        name: {
          S: name,
        },
        email: {
          S: email,
        },
        location: {
          S: location,
        },
        photo: {
          S: photo,
        },
      },
    };
    dynamodb.putItem(addParams, function (err, data) {
      if (err) {
        res.status(500).json(responseHelper.getErrorResponse(err));
      } else {
        res.status(200).json(
          responseHelper.getSuccessResponse({
            id: id,
            name: name,
            location: location,
            email: email,
            photo: photo,
          })
        );
      }
    });
  } catch (err) {
    console.log('Unexpected error!');
    res.status(500).json({
      error: {
        message: 'Unable to get employees.',
        err: err,
      },
    });
  }
};

exports.updateEmployee = (req, res, next) => {
  try {
    const id = req.body['id'];
    const name = req.body['name'];
    const email = req.body['email'];
    const location = req.body['location'];
    const photo = req.body['photo'];

    var updateParams = {
      TableName: constants.TABLE_NAME,
      Key: {
        id: { S: id },
      },
      UpdateExpression: 'set #n=:n, #l=:l, email=:e, photo=:p',
      ExpressionAttributeNames: { '#n': 'name', '#l': 'location' },
      ExpressionAttributeValues: {
        ':n': { S: name },
        ':l': { S: location },
        ':e': { S: email },
        ':p': { S: photo },
      },
      ReturnValues: 'UPDATED_NEW',
    };

    dynamodb.updateItem(updateParams, function (err, data) {
      if (err) {
        console.log(err);
        res.status(500).json(responseHelper.getErrorResponse(err));
      } else {
        res.status(200).json(
          responseHelper.getSuccessResponse({
            id: id,
            name: name,
            location: location,
            email: email,
            photo: photo,
          })
        );
      }
    });
  } catch (err) {
    console.log('Unexpected error!');
    res.status(500).json({
      error: {
        message: 'Unable to get employees.',
        err: err,
      },
    });
  }
};
exports.getEmployeePhoto = (req, res, next) => {
  const objectKey = req.body['key'];
  if (objectKey === '') {
    res.status(404).json(responseHelper.getSuccessResponse(''));
  } else {
    S3.getSignedUrl(
      'getObject',
      {
        Bucket: constants.PHOTOS_BUCKET,
        Key: objectKey,
      },
      function (err, data) {
        if (err) {
          res.status(500).json(responseHelper.getErrorResponse(err));
        } else {
          res.status(200).json(responseHelper.getSuccessResponse(data));
        }
      }
    );
  }
};

exports.getUploadUrl = (req, res, next) => {
  const objectKey = req.body['key'];
  const type = req.body['type'];
  S3.getSignedUrl(
    'putObject',
    {
      Bucket: constants.PHOTOS_BUCKET,
      Key: objectKey,
      ContentType: type,
    },
    function (err, data) {
      if (err) {
        res.status(500).json(responseHelper.getErrorResponse(err));
      } else {
        res.status(200).json(responseHelper.getSuccessResponse(data));
      }
    }
  );
};

exports.getImages = (req, res, next) => {
  const params = {
    Bucket: constants.PHOTOS_BUCKET,
  };
  S3.listObjectsV2(params, function (err, data) {
    if (err) {
      res.status(500).json(responseHelper.getErrorResponse(err));
    } else {
      const images = data.Contents.map((i) => {
        return { id: i.Key };
      });
      res.status(200).json(
        responseHelper.getSuccessResponse({
          bucket: constants.PHOTOS_BUCKET,
          images: images,
        })
      );
    }
  });
};
