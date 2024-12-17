const AWS = require('aws-sdk');
const constants = require('../api/common/constants');
const s3 = new AWS.S3();

async function getRegionFromBucket() {
  try {
    if (constants.PHOTOS_BUCKET !== '') {
      const { LocationConstraint } = await s3
        .getBucketLocation({ Bucket: constants.PHOTOS_BUCKET })
        .promise();
      return LocationConstraint || 'us-east-1'; //The client returns <empty> for us-east-1
    }
  } catch (e) {
    console.log(e);
  }
  return 'unknown-region';
}

if (constants.NODE_ENV === 'development') {
  require('dotenv').config();
  AWS.config.update({
    credentials: new AWS.ProcessCredentials({
      profile: constants.AWS_PROFILE,
    }),
    signatureVersion: 'v4',
  });
}

if (constants.DEFAULT_AWS_REGION === '') {
  getRegionFromBucket().then((r) => {
    AWS.config.update({
      region: r,
    });
  });
} else {
  AWS.config.update({
    region: constants.DEFAULT_AWS_REGION,
  });
}

module.exports = AWS;
module.exports.getRegionFromBucket = getRegionFromBucket;
