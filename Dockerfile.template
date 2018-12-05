FROM resin/raspberrypi3-node

WORKDIR /usr/src/imuse

RUN apt-get update && \
	apt-get install -yq scons pigpio git && \
	apt-get clean && \
	npm install -g node-gyp && \
	npm cache clean --force

COPY tsconfig.json ./tsconfig.json
COPY ssh_config /etc/ssh/ssh_config
COPY package.json ./package.json

RUN npm install --unsafe-perm && \
	npm cache clean --force

COPY src ./src

RUN npm run build && \
	rm -rf ./src && \
	rm ./tsconfig.json && \
	npm prune --production && \
	npm cache clean --force

# ENV INITSYSTEM on

COPY themes ./themes

CMD ["npm", "start"]
