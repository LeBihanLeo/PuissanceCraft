docker-compose down
docker image rm puissance-craft-node
docker image rm puissance-craft-mongo

docker build -f .\Dockerfile-app -t puissance-craft-node .
docker build -f .\Dockerfile-mongo -t puissance-craft-mongo .

docker-compose up -d