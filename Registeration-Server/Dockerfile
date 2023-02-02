FROM node

# create app directory
RUN mkdir -p /home/app/src
WORKDIR /home/app

# install app dependencies
COPY ./package.json /home/app
RUN npm install

COPY ./index.js /home/app
COPY ./src /home/app/src

# CMD ["node", "/home/app/src/index.js"]
# direction related to 'WORKDIR'
CMD ["node", "."]