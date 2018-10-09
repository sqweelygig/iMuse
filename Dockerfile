FROM resin/raspberrypi3-node

RUN apt-get update && \
	apt-get install -yq scons pigpio && \
	apt-get clean

RUN npm install -g node-gyp && \
	npm cache clean --force

WORKDIR /usr/src/imuse

COPY ./cabinet/package.json ./package.json

RUN JOBS=MAX npm install --unsafe-perm && \
	npm cache clean --force

COPY ./cabinet ./

RUN npm run build

RUN rm -rf ./src

RUN JOBS=MAX npm prune --production && \
	npm cache clean --force

# ENV INITSYSTEM on

CMD ["npm", "start"]
