#!/bin/sh

sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install systemd
sudo apt install unzip
sudo apt install nodejs npm -y
sudo groupadd csye6225
sudo useradd -s /bin/false -g csye6225 -d /opt/csye6225 -m csye6225
sudo mv /home/admin/webapp.zip /opt/csye6225/webapp.zip
sudo unzip -o /opt/csye6225/webapp.zip -d /opt/csye6225/
cd /opt/csye6225/
ls
sudo npm i
sudo cp /home/admin/aws-debian.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable aws-debian.service
sudo systemctl start aws-debian.service