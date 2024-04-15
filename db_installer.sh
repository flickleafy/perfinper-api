# MongoDb
# Import the public key used by the package management system
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create a list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update the package database
sudo apt-get update

# Install the MongoDB packages
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Check the status of the MongoDB service
sudo systemctl status mongod

sudo systemctl enable mongod

# Install mongosh
sudo apt-get install -y mongosh

mongosh

# MongoDb Compass
wget https://downloads.mongodb.com/compass/mongodb-compass_1.42.5_amd64.deb
sudo dpkg -i mongodb-compass_1.42.5_amd64.deb
#sudo apt-get install -f

# Launch MongoDB Compass
mongodb-compass
