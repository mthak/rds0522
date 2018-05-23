provider "aws" {
  region = "us-east-1"
}

data "aws_caller_identity" "current" {}

variable "component" {}
variable "environment" {}
variable "esdomain" {}
variable "name" {}
variable "rdslogs3bucket" {}
variable "s3_bucket" {}
variable "s3_path" {}
variable "git_commit" {}

variable "security_group_ids" {
  default = "sg-ad2272da"
}

variable "subnet_ids" {
  type = "list"
}

variable "vpc" {
  type = "string"
}

data "aws_security_group" "security_group_ids" {
  id = "${var.security_group_ids}"
}

resource "aws_lambda_function" "s3-to-es" {
  description = "Transform RDS logs from S3 and send to ES"
  function_name = "jdf-ops-rds-transform-logs-es-tf"
  handler = "index.handler"
  memory_size = "128"
  timeout = "300"
  runtime = "nodejs6.10"
  role = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/ops/rds-log-export"
  s3_bucket = "${var.s3_bucket}"
  s3_key = "${var.s3_path}/s3-to-es-${var.git_commit}.zip"

  vpc_config {
    security_group_ids = [
      "${var.security_group_ids}"]
    subnet_ids = [
      "${var.subnet_ids}"]
  }

  environment {
    variables = {
      esdomain = "${var.esdomain}"
    }
  }

  tags {
    component = "${var.component}"
    Name = "${var.name}"
  }
}

resource "aws_lambda_permission" "allow_es_policy" {
  statement_id = "AllowExecutionFromS3Bucket"
  action = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.s3-to-es.function_name}"
  principal = "s3.amazonaws.com"
  source_arn = "arn:aws:s3:::${var.s3_bucket}/RDS"
}

resource "aws_s3_bucket" "s3bucket" {
  bucket = "${var.s3_bucket}"
}


resource "aws_lambda_function" "rdslogs3bucket" {
  filename = "${var.s3_path}/s3-to-es-${var.git_commit}.zip"
  function_name = "jdf-ops-rds-transform-logs-es-tf"
  role = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/ops/rds-log-export"
  handler = "rds_log_ship.lambda_handler"
  runtime = "nodejs6.10"
  s3_bucket = "${var.rdslogs3bucket}"
  timeout = "300"

}

/*resource "aws_s3_bucket" "rdslogs3bucket" {
  bucket = "${var.rdslogs3bucket}"
}

resource "aws_lambda_permission" "allow_rdslogs3bucket_policy" {
  statement_id = "AllowExecutionToS3Logs"
  action = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.s3-to-es.arn}"
  principal = "s3.amazonaws.com"
  source_arn = "${aws_s3_bucket.rdslogs3bucket.arn}"
}


resource "aws_s3_bucket_notification" "rdsbucket_notification" {
  bucket = "${aws_s3_bucket.rdslogs3bucket.id}"

  lambda_function {
    lambda_function_arn = "${aws_lambda_function.s3-to-es.arn}"
    events = [
      "s3:ObjectCreated:*"]
    filter_prefix = "RDS/"
    filter_suffix = ".log"
  }
}
*/

data "aws_s3_bucket" "rdslogs3bucket2" {
  bucket = "${var.rdslogs3bucket}"
}
resource "aws_cloudtrail" "SendToCloudTrailLambdaDevl" {
  name = "SendToCloudTrailLambdaProd"
  s3_bucket_name = "${aws_s3_bucket.rdslogs3bucket.id}"
  s3_key_prefix = "prefix"
  cloud_watch_logs_role_arn = "arn:aws:lambda:us-east-1:515947518870:function:continuous-audit-cloudtrail-processor"
  //value = "AWSCloudTrail/"

  event_selector {
    read_write_type = "All"
    include_management_events = true

    data_resource {
      type = "AWS::S3::Object"
      values = [
        "${data.aws_s3_bucket.rdslogs3bucket2.arn}/AWSCloudTrail/"]
    }
  }
}
