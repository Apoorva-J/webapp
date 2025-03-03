instance_type                                      = "t2.micro"
source_ami                                         = "ami-06db4d78cb1d3bbf9"
ssh_username                                       = "admin"
ami_users                                          = ["504987508647", "059182746429"]
aws_region                                         = "us-east-1"
ami_name                                           = "csye6225_"
ami_description                                    = "AMI for CSYE6225"
aws_polling_max_attempts                           = "50"
aws_polling_delay_seconds                          = "120"
launch_block_device_mappings_device_name           = "/dev/xvda"
launch_block_device_mappings_volume_size           = "25"
launch_block_device_mappings_volume_type           = "gp2"
launch_block_device_mappings_delete_on_termination = "true"
provisioner_users_source                           = "./users.csv"
provisioner_users_destination                      = "/home/admin/users.csv"
provisioner_webapp_source                          = "./webapp.zip"
provisioner_webapp_destination                     = "/home/admin/webapp.zip"
provisioner_service_source                         = "./aws-debian.service"
provisioner_service_destination                    = "/home/admin/"
provisioner_shell_script                           = "./setup.sh"
ami_region                                         = ["us-east-1"]
date_format                                        = "YYYY_MM_DD_hh_mm_ss"
provisioner_config_source                          = "cloudwatchConfig.json"
provisioner_config_destination                     = "/home/admin/cloudwatchConfig.json"

