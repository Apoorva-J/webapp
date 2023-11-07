#!/bin/sh

sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install systemd
sudo apt install unzip
sudo apt install nodejs npm -y
sudo groupadd csye6225
sudo useradd -s /bin/false -g csye6225 -d /opt/csye6225 -m csye6225
sudo mv /home/admin/webapp.zip /opt/csye6225/webapp.zip
# sudo mv /home/admin/users.csv /opt/csye6225/users.csv
sudo mv /home/admin/cloudwatch-config.json /opt/csye6225/cloudwatch-config.json
sudo unzip -o /opt/csye6225/webapp.zip -d /opt/csye6225/
cd /opt/csye6225/
ls
sudo npm i
sudo cp /home/admin/aws-debian.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable aws-debian.service
sudo systemctl start aws-debian.service

sudo wget https://amazoncloudwatch-agent.s3.amazonaws.com/debian/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
 
sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl start amazon-cloudwatch-agent