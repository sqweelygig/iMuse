FROM resin/raspberrypi3-node

RUN apt-get update && apt-get install -yq \
    scons pigpio

RUN npm install -g node-gyp

WORKDIR /usr/src/imuse

COPY ./cabinet/package.json ./package.json

RUN JOBS=MAX npm install --unsafe-perm

COPY ./cabinet ./

RUN npm run build

RUN rm -rf ./src

# ENV INITSYSTEM on

CMD ["npm", "start"]