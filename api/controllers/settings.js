const AWS = require('aws-sdk');
const constants = require('../common/constants');
const process = require('child_process');
const responseHelper = require('../../helpers/response');
const dynamodb = new AWS.DynamoDB();
const s3 = new AWS.S3();
const axios = require('axios');

exports.getSettings = async (req, res, next) => {
  try {
    // console.log('settings::getSettings');
    const settings = {
      database: await hasDynamoDBAccess(),
      s3: await hasS3Access(),
      photosBucket: constants.PHOTOS_BUCKET,
      region: AWS.config.region,
      showWarnings: parseInt(constants.SHOW_WARNINGS) === 1,
      showAdminTools: parseInt(constants.SHOW_ADMIN_TOOLS) === 1,
    };
    //console.log(settings);
    res.status(200).json(settings);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.stressServer = (req, res, next) => {
  try {
    const secsParam = req.body['seconds'];
    // console.log('settings::stressServer');
    // console.log('Running process for seconds: ' + seconds);
    const seconds = parseInt(secsParam);
    if (Number.isNaN(seconds)) {
      res
        .status(500)
        .json(responseHelper.getErrorResponse({ msg: 'What are you doing?' }));
    } else {
      process.exec(
        `stress --cpu 8 --timeout ${seconds}`,
        (error, stdout, stderr) => {
          if (error) {
            res.status(500).json(responseHelper.getErrorResponse(error));
          } else {
            res.status(200).json(
              responseHelper.getSuccessResponse({
                stdout: stdout,
                stderr: stderr,
              })
            );
          }
        }
      );
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.cpuUsage = (req, res, next) => {
  try {
    process.exec(
      `echo $(vmstat 1 2|tail -1|awk '{print $15}')`,
      (error, stdout, stderr) => {
        if (error) {
          res.status(500).json(responseHelper.getErrorResponse(error));
        } else {
          res.status(200).json(
            responseHelper.getSuccessResponse({
              stdout: 100 - parseInt(stdout),
              stderr: stderr,
            })
          );
        }
      }
    );
  } catch (err) {
    console.log(err);
    next(err);
  }
};
exports.getInfo = (req, res, next) => {
  try {
    // console.log('settings::getInfo');
    axios
      .get('http://169.254.169.254/latest/dynamic/instance-identity/document', {
        timeout: 5000,
      })
      .then((response) => {
        res.status(200).json(responseHelper.getSuccessResponse(response.data));
      })
      .catch((e) => {
        console.log(e);
        res
          .status(200)
          .json(responseHelper.getSuccessResponse({ availabilityZone: 'n/a' }));
      });
  } catch (err) {
    console.log(err);
    res
      .status(200)
      .json(responseHelper.getSuccessResponse({ availabilityZone: 'n/a' }));
  }
};

exports.setBucket = (req, res, next) => {
  try {
    // console.log('settings::setBucket');
    const bucket = req.body['bucket'];
    constants.PHOTOS_BUCKET = bucket;
    res.status(200).json(responseHelper.getSuccessResponse({ bucket: bucket }));
  } catch (err) {
    res.status(404).json(responseHelper.getErrorResponse(err));
  }
};

async function hasS3Access() {
  try {
    // console.log('settings::hasS3Access');
    if (constants.PHOTOS_BUCKET === '') return false;
    const data = await s3
      .headBucket({ Bucket: constants.PHOTOS_BUCKET })
      .promise();
    return data !== undefined && data !== null;
  } catch (e) {
    return false;
  }
}

async function hasDynamoDBAccess() {
  try {
    // console.log('settings::hasDynamoDBAccess');
    const existsParams = {
      TableName: constants.TABLE_NAME,
    };
    const data = await dynamodb.listTables().promise();
    return data.TableNames.indexOf(existsParams.TableName) >= 0;
  } catch (e) {
    return false;
  }
}
