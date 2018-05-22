import os
from datetime import datetime

import boto3

REGION = 'us-east-1'
s3_bucket = os.environ['S3_BUCKET']

RDSclient = boto3.client('rds', region_name=(REGION))
S3client = boto3.client('s3', region_name=(REGION))
date_string = datetime.utcnow().strftime("%Y-%m-%d")


def lambda_handler(event, context):
    rds_response = RDSclient.describe_db_instances()
    for rds in rds_response['DBInstances']:  # loop through RDS instances
        rds_instance_id = rds[u'DBInstanceIdentifier']
        db_engine = rds[u'Engine']
        print"Retrieving log files from '%s'" % rds_instance_id
        s3_sub_folder = 'RDS/' + db_engine + '/' + rds_instance_id + '/'
        uploaded_files = find_uploaded_files(sub_folder=s3_sub_folder)
        print " \t- %s files have already been uploaded" % len(uploaded_files)
        logs_to_download = find_logs_to_download(db_instance=rds_instance_id, existing_files=uploaded_files)
        print " \t- %s files will be uploaded" % len(logs_to_download)
        download_and_upload_log_files(db_instance=rds_instance_id, logs_to_download=logs_to_download, s3_sub_folder=s3_sub_folder)


def find_uploaded_files(sub_folder):
    file_keys = []
    objects = S3client.list_objects_v2(Bucket=s3_bucket, Prefix=sub_folder + date_string)
    if objects[u'KeyCount'] == 0:
        return file_keys
    for file_object in objects[u'Contents']:
        key = file_object[u'Key']
        folders = key.split('/')
        file_keys.append(folders[len(folders) - 1])
    return file_keys


def find_logs_to_download(db_instance, existing_files):
    logs_to_download = []
    db_logs = RDSclient.describe_db_log_files(DBInstanceIdentifier=db_instance)
    for db_log in db_logs[u'DescribeDBLogFiles']:
        if date_string in db_log['LogFileName']:
            logs_to_download.append(db_log['LogFileName'].replace('/', '-'))

    for existing_log in existing_files:
        if existing_log in logs_to_download:
            logs_to_download.remove(existing_log)
    return logs_to_download


def download_and_upload_log_files(db_instance, logs_to_download, s3_sub_folder):
    for log in logs_to_download:
        rds_log_file_name = log.replace('error-', 'error/')
        try:
            log_file_response = RDSclient.download_db_log_file_portion(DBInstanceIdentifier=db_instance, LogFileName=rds_log_file_name, Marker='0')
            print "\t\t- %s" % rds_log_file_name
            print "\t\t\t- Downloading chunk 0 for " + rds_log_file_name + " -> Marker is " + log_file_response['Marker']
            log_file_data = log_file_response['LogFileData']
            chunk_number = 1
            while log_file_response['AdditionalDataPending']:
                print "\t\t\t- Downloading chunk " + str(chunk_number) + " for " + rds_log_file_name + " -> Marker is " + log_file_response['Marker']
                log_file_response = RDSclient.download_db_log_file_portion(DBInstanceIdentifier=db_instance, LogFileName=rds_log_file_name, Marker=log_file_response['Marker'])
                log_file_data += log_file_response['LogFileData']
                chunk_number += 1
            object_contents = str.encode(log_file_data)
            object_name = s3_sub_folder + date_string + '/' + log
            print "\t\t\t--- Uploading " + object_name + " to bucket: " + s3_bucket
            S3client.put_object(Bucket=s3_bucket, Key=object_name, Body=object_contents, ServerSideEncryption='AES256')
        except Exception as e:
            print "**********Error writing object to S3 bucket, S3 ClientError: " + e.message
    print ("done")


if __name__ == "__main__":
    lambda_handler("", "")
