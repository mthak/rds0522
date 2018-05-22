provider "aws" {
  region = "us-east-1"
}

data "aws_caller_identity" "current" {}
variable "s3_path" {}
variable "s3_bucket" {}
variable "git_commit" {}

resource "aws_lambda_function" "Rds_to_S3" {
  description = "Ship RDS logs to S3"
  function_name = "jdf-ops-ship-rds-logs-to-s3"
  handler = "rds_log_ship.lambda_handler"
  memory_size = "750"
  timeout = "300"
  runtime = "python2.7"
  role = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/ops/rds-log-export"
  s3_bucket = "${var.s3_bucket}"
  s3_key = "${var.s3_path}/s3-to-es-${var.git_commit}.zip"

}

resource "aws_cloudwatch_event_rule" "jdf-ops-ship-RDS-logs-to-jdfOpsShipRdsLogsToS3Shipper" {
  name = "rds-to-s3log-shipper"
  description = "Fires everyhour past 5"
  schedule_expression = "cron(5 * * * ? *)"
}

resource "aws_cloudwatch_event_target" "check_lambda_everyhour_past_five" {
  rule = "${aws_cloudwatch_event_rule.jdf-ops-ship-RDS-logs-to-jdfOpsShipRdsLogsToS3Shipper.name}"
  target_id = "Rds_to_S3"
  arn = "${aws_lambda_function.Rds_to_S3.arn}"
}

