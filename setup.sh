#!/bin/sh
sudo apt-get update
sudo apt-get upgrade -y
sudo apt install unzip
sudo apt install nodejs npm -y
sudo apt install mariadb-server -y
sudo mysql -e "SET PASSWORD FOR root@localhost = PASSWORD('admin123');FLUSH PRIVILEGES;"
printf 'admin123\n n\n n\n n\n n\n n\n y\n' | sudo mysql_secure_installation
sudo mysql -e "GRANT ALL PRIVILEGES ON assignment1_db.* TO 'root'@'localhost' IDENTIFIED BY 'admin123';"
mysql -u root -padmin123 -Bse "CREATE DATABASE assignment1_db;"
mysql -u root -padmin123 -Bse "SHOW DATABASES;"
sudo mkdir opt
sudo mv /home/admin/webapp.zip /home/admin/opt/webapp.zip
cd opt
sudo unzip -o webapp.zip
sudo mv /home/admin/users.csv /home/admin/opt/webapp/users.csv
cd webapp
sudo npm i
# sudo npm audit fix
sudo npm start
# npm run test
