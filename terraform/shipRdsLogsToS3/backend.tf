terraform {
  backend "s3" {
    bucket               = "aws-jdf-terraform-state"
    encrypt              = true
    key                  = "shipRdsLogsToS3"
    region               = "us-east-1"
    workspace_key_prefix = "shipRdsLogsToS3"
  }
}

