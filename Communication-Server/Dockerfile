FROM node

# create app directory
RUN mkdir -p /home/app/src
WORKDIR /home/app

# install app dependencies
COPY ./package.json /home/app
RUN npm install

# install app data
COPY ./index.js /home/app
COPY ./src /home/app/src

# the path is related to 'WORKDIR'
# CMD run every time we make a container (unlike RUN that is for creating an image)
CMD [ "node", "." ]