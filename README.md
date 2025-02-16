# Employee directory app on aws

A simple and scalable employee directory application deployed on AWS, allowing you to view and manage employee information with photos stored in S3 and data in DynamoDB. 
Running as a Docker container on an EC2 instance within a VPC with subnets across multiple availability zones for high availability, it uses an Internet Gateway for internet access. 
Security groups and IAM roles ensure secure resource access. 
Auto Scaling adjusts the number of EC2 instances based on CPU usage, while an Application Load Balancer distributes traffic for reliability and performance.

- [Prerequisites](#prerequisites-)
- [Dockerizing the app](#dockerizing-the-app-)
- [Architecture](#architecture-)
- [Deploying on AWS](#deploying-on-aws-)
    - [Setting up a VPC](#setting-up-a-vpc-)
    - [Configuring IAM roles and security groups](#configuring-iam-roles-and-security-groups-)
    - [Setting up S3 and DynamoDB](#setting-up-s3-and-dynamodb-)
    - [Launching an EC2 instance](#launching-an-ec2-instance-)
- [Auto Scaling](#auto-scaling-) 
    - [Setting up a Target Group](#setting-up-a-target-group-)
    - [Creating a Load Balancer](#creating-a-load-balancer-)
    - [Setting up  a launsh template](#setting-up--a-launsh-template-)
    - [Creating an Auto Scaling Group](#creating-an-auto-scaling-group-)
- [Testing the Auto Scaling](#testing-the-auto-scaling-)
- [Results](#results-)

## Prerequisites :

* an AWS account (Free tier)
* Docker

## Dockerizing the app :

* add the necessary environment variables to the `.env` file <a href="./env.example">.env.example</a>

    ```
    NODE_ENV= "production ,development"
    PORT= "port number"
    AWS_PROFILE=default
    PHOTOS_BUCKET= "bucket-name"
    DEFAULT_AWS_REGION= "region"
    TABLE_NAME= "name of the database table"
    ```

* created two docker file versions :

    - simplified version <a href="./dockerfile">dockerfile</a>
    - optimized version <a href="./dockerfile-optimized">dockerfile-optimized</a>

* the optimized version takes up less space but uses two stages unlike the simplified version, it also uses lightweight alpine images as base

    <img src="./imgs/opt⁄smp.png" style="width:100%">

    ```
    docker build . -f dockerfile-optimized -t hamdiz0/empdir-app
    ```
* pushed the optimized image version to dockerhub :

    ```
    docker push hamdiz0/empdir-app
    ```
## Architecture :

<img src="./imgs/empdir.png" style="width:100%">

## Deploying on AWS :

### Setting up a VPC :

* creata VPC with two subnets in two different avaibility zones

    <img src="./imgs/vpc.png" style="width:100%">

* add a Internet Gateway and attached it to the VPC allowing access to internet

    <img src="./imgs/gw.png" style="width:100%">

* setup a Route Table for public access throught the created Internet Gateway

    <img src="./imgs/rt.png" style="width:100%">

* associate the subnetes to the public Route Table

    <img src="./imgs/rt-assoc.png" style="width:100%">

* create an Access List allowing both Inbound and Outbound traffic to the created subnets

    <img src="./imgs/acls.png" style="width:100%">

### Configuring IAM roles and security groups :

* create an custom IAM role for the EC2 instance to grant full access to S3 along with DynamoDB

    <img src="./imgs/role.png" style="width:100%">

* add a security group to allow SSH (optional), HTTP and HTTPS traffic

    <img src="./imgs/sec.png" style="width:100%">

### Setting up S3 and DynamoDB :

* create an S3 bucket to store the employees images
* pre upload the <a href="./employee-img/" >employees images</a> to the bucket for testing

    <img src="./imgs/upload.png" style="width:100%"> 

* add a policy to the bucket in the permissions tab to allow the EC2 instance to access the bucket using the IAM role

    ```
    {
        "Version":"2012-10-17",
        "Statement":[
            {
                "Sid":"AllowS3ReadAccess",
                "Effect":"Allow",
                "Principal": {
                    "AWS":"arn:aws:iam::<ACCOUNT-NUMBER>:role/<ROLE>"   // ensure only the IAM role can access the bucket
                },
                "Action":"s3:*",                                        // full access
                "Resource":[
                    "arn:aws:s3:::<BUCKET-NAME>",                       // allow operations on the bucket itself
                    "arn:aws:s3:::<BUCKET-NAME>/*"                      // allow opertaions on the bucket objects
                ]
            }
        ]
    }
    ```
* add CROS configuration to the bucket to avoid request issues 

    ```
    [
        {
            "AllowedHeaders": ["*"],                                    // allow all headers
            "AllowedMethods": [                                         // allow GET ,POST and PUT http methods
                "GET",
                "POST",
                "PUT"
            ],
            "AllowedOrigins": ["*"],                                    // allow all traffic ,you can specify a specific url
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
    ```

* add a DynamoDB table to store the employee information 

    <img src="./imgs/dynamo.png" style="width:100%">

### Launching an EC2 instance :

* launch the instance on a public subnet of the created VPC
* attach the security group 

    <img src="./imgs/ec2-net.png" style="width:100%">

* add the "s3dynamodbfullaccess" role to the EC2

    <img src="./imgs/ec2-addrole.png" style="width:100%">

* make sure the Metadata service is enabled with both versions v1 and v2 allowing the app to retrieve the instance metadata

    <img src="./imgs/v1andv2.png" style="width:100%">    

* add a script in the user data field to launch the app automaticly when the instance done creating 

    <img src="./imgs/ec2-user-data.png" style="width:100%">

* the script installs docker and launches the app as a container

    ```
    #!/bin/bash

    USER_NAME="ubuntu"

    # install docker
    curl -fsSL https://test.docker.com -o test-docker.sh
    sudo sh test-docker.sh
    sudo usermod -aG docker $USER_NAME
    newgrp docker

    # run the employee directory app as container
    sudo -u $USER_NAME docker run -p 80:80 -d --name=empdir hamdiz0/empdir-app
    ```
* alternatively you can launch the app directly not as a docker container with the following script

    ```
    #!/bin/bash

    # Set environment variables
    export PORT="80"
    export PHOTOS_BUCKET="s3-bucket-name"
    export DEFAULT_AWS_REGION="region"
    export SHOW_ADMIN_TOOLS="1"

    # Update apt
    apt update -y

    # Install tools and dependencies
    apt install stress nodejs npm unzip -y

    # Create a dedicated directory for the application
    sudo mkdir -p /var/app
    cd /var/app

    # Download the app from S3
    wget https://aws-tc-largeobjects.s3-us-west-2.amazonaws.com/ILT-TF-100-TECESS-5/app/app.zip

    # Extract it to the desired folder
    sudo unzip app.zip -d /var/app/
    cd /var/app/

    # Install dependencies
    npm install

    # Start the app
    npm start
    ```
* a crontab expression can be added to strat the app on boot

    ```
    @reboot docker run -p 80:80 -d --name=empdir hamdiz0/empdir-app
    ```
    ```
    @reboot cd /var/app/ && npm start
    ```
* the app can be accessed throught http using the EC2 instance ip@

    ```
    http://<EC2_IP_ADDRESS>:80
    ```

## Auto Scaling :

### Setting up a Target Group :

* create a target group for the EC2 instances 
* add the VPC along with the disired health check settings

    <img src="./imgs/tg-1.png" style="width:100%">
    <img src="./imgs/tg.png" style="width:100%">


### Creating a Load Balancer :

* create an Application Load Balancer (ALB)

    <img src="./imgs/lb-alb.png" style="width:100%">

* add the VPC network and the created subnets along with the security group

    <img src="./imgs/lb-net.png" style="width:100%">

* add the target group to the ALB

    <img src="./imgs/lb-tg.png" style="width:100%">

* the app can be accessed throught the ALB DNS name

    ```
    http://<ALB_DNS_NAME>
    ```

    <img src="./imgs/lb.png" style="width:100%">

### Setting up  a launsh template : 

* configure the template with the AMI from the previous EC2 instance along with network settings , IAM role and user data (launching script)

* make sure the auto assign public ip is enabled

    <img src="./imgs/lt-net.png" style="width:100%">

### Creating an Auto Scaling Group :

* add the created launch template

   <img src="./imgs/sg.png" style="width:100%">
   
* add the VPC with the desired availability zones

    <img src="./imgs/sg-net.png" style="width:100%">

* attach the load balancer and the target group

    <img src="./imgs/sg-lb.png" style="width:100%">

* configue the scaling values to youre needs

    <img src="./imgs/sg-scal.png" style="width:100%">

* add a scaling policy to scale up and down based on the CPU usage (50% in this case)

    <img src="./imgs/sg-scal-pol.png" style="width:100%">

## Testing the Auto Scaling :

* if you refresh the app page you will notice that the "Availability Zone" along with the "EC2 Instance Id" values change indicating that the app is being served by different instances

    <img src="./imgs/3a.png" style="width:100%">

    <img src="./imgs/3b.png" style="width:100%">

* the app has a built in stress feature that uses the stress linux utility to simulate high CPU usage

* start the stress test by clicking the "Stress Application Server For" button

    <img src="./imgs/stress.png" style="width:100%">

* the number of instances before starting the stress test

    <img src="./imgs/before-scal.png" style="width:100%">

* the number of instaces increases when the CPU usage exceeds the threshold from 2 to 4 instances

    <img src="./imgs/after-scal.png" style="width:100%">

    <img src="./imgs/scal-up.png" style="width:100%">

* the cpu usage drops drastically after the app scales up

    <img src="./imgs/stress-after-scal.png" style="width:100%">

* after the stress test is done the number of instances goes back to the initial value

    <img src="./imgs/scal-down.png" style="width:100%">

## Results :

* Application

<img src="./imgs/0.png" style="width:100%">

<img src="./imgs/1.png" style="width:100%">

<img src="./imgs/2.png" style="width:100%">

<img src="./imgs/3.png" style="width:100%">

* DynamoDB table

<img src="./imgs/dynamores.png" style="width:100%">

* adding an employee with an uploaded image

<img src="./imgs/4.png" style="width:100%">

<img src="./imgs/5.png" style="width:100%">

## Checkout my <a href="https://github.com/hamdiz0/LearningDevOps">LearningDevops</a> repo for more details about these tools and devops in general do not hesitate to contribute