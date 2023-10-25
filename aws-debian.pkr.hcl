packer {
  required_plugins {
    amazon = {
      version = " >= 1.2.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "ami_name" {
  type    = string
  default = "csye6225_"
}

variable "ami_description" {
  type    = string
  default = "AMI for CSYE6225"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "ami_users" {
  type    = list(string)
  default = ["504987508647", "059182746429"]
}

variable "ami_region" {
  type    = list(string)
  default = ["us-east-1"]
}

variable "source_ami" {
  type    = string
  default = "ami-06db4d78cb1d3bbf9"
}

variable "ssh_username" {
  type    = string
  default = "admin"
}

variable "launch_block_device_mappings_device_name" {
  type    = string
  default = "/dev/xvda"
}

variable "aws_polling_delay_seconds" {
  type    = string
  default = "120"
}

variable "aws_polling_max_attempts" {
  type    = string
  default = "50"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}


variable "launch_block_device_mappings_volume_size" {
  type    = string
  default = "25"
}

variable "launch_block_device_mappings_volume_type" {
  type    = string
  default = "gp2"
}

variable "launch_block_device_mappings_delete_on_termination" {
  type    = string
  default = "true"
}

variable "provisioner_users_source" {
  type    = string
  default = "./users.csv"
}

variable "provisioner_users_destination" {
  type    = string
  default = "/home/admin/users.csv"
}

variable "provisioner_webapp_source" {
  type    = string
  default = "./webapp.zip"
}

variable "provisioner_webapp_destination" {
  type    = string
  default = "/home/admin/webapp.zip"
}

variable "provisioner_shell_script" {
  type    = string
  default = "./setup.sh"
}

variable "date_format" {
  type    = string
  default = "YYYY_MM_DD_hh_mm_ss"
}

variable "provisioner_service_source" {
  type    = string
  default = null
}

variable "provisioner_service_destination" {
  type    = string
  default = null
}

variable "provisioner_service_source" {
  type    = string
  default = null
}

variable "provisioner_service_destination" {
  type    = string
  default = null
}

source "amazon-ebs" "awsdebian" {
  ami_name        = "${var.ami_name}_${formatdate("${var.date_format}", timestamp())}"
  ami_description = "${var.ami_description}"
  region          = "${var.aws_region}"
  ami_users       = "${var.ami_users}"
  ami_regions     = "${var.ami_region}"

  aws_polling {
    delay_seconds = "${var.aws_polling_delay_seconds}"
    max_attempts  = "${var.aws_polling_max_attempts}"

  }

  instance_type = "${var.instance_type}"
  source_ami    = "${var.source_ami}"
  ssh_username  = "${var.ssh_username}"

  launch_block_device_mappings {
    device_name           = "${var.launch_block_device_mappings_device_name}"
    volume_size           = "${var.launch_block_device_mappings_volume_size}"
    volume_type           = "${var.launch_block_device_mappings_volume_type}"
    delete_on_termination = "${var.launch_block_device_mappings_delete_on_termination}"
  }
}

build {
  sources = [
    "source.amazon-ebs.awsdebian"
  ]

  provisioner "file" {
    source      = "${var.provisioner_users_source}"
    destination = "${var.provisioner_users_destination}"
  }

  provisioner "file" {
    source      = "${var.provisioner_webapp_source}"
    destination = "${var.provisioner_webapp_destination}"
  }

  provisioner "file" {
    source      = "${var.provisioner_service_source}"
    destination = "${var.provisioner_service_destination}"
  }

  provisioner "shell" {
    script = "${var.provisioner_shell_script}"
  }
}
