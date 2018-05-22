terraform {
  backend "s3" {
    bucket               = "aws-jdf-terraform-state"
    encrypt              = true
    key                  = "transformlogstoes"
    region               = "us-east-1"
    workspace_key_prefix = "transformlogstoes"
  }
}
