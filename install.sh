#!/bin/bash

# ============================================
# RUN: sudo ./install.sh
# ============================================

set -e

# Colors
black=`tput setaf 0`
red=`tput setaf 1`
green=`tput setaf 2`
yellow=`tput setaf 3`
blue=`tput setaf 4`
magenta=`tput setaf 5`
cyan=`tput setaf 6`
white=`tput setaf 7`
reset=`tput sgr0`

function log() {
    date_now=`date '+%Y-%m-%d %H:%M:%S'`
    case $1 in
        debug)   echo -e "${date_now} :: ${2}" ;;
        warning) echo -e "${date_now} :: ${yellow}${2}${reset}" ;;
        error)   echo -e "${date_now} :: ${red}${2}${reset}" ;;
        *)       echo -e "${date_now} :: ${magenta}${1}${reset}" ;;
    esac
}

# OS check
unamestr=$(uname)
if [[ "$unamestr" != 'Linux' ]]; then
    log warning "This install script works only on Linux"
    exit
fi

# Root check
if [ "$EUID" -ne 0 ]; then 
    log warning "Run as root: sudo ./install.sh"
    exit
fi

# ============================================
# Install dependencies
# ============================================

printf 'Install the dependencies (y/n)? '
read answer

if [ "$answer" != "${answer#[Yy]}" ] ;then

    log "Refresh zypper repositories"
    echo noman-dev3 | sudo -S zypper refresh

    log "Install compiler tools"
    echo noman-dev3 | sudo -S zypper install -y gcc gcc-c++ make

    log "Install Python 3.8 + pip"
    echo noman-dev3 | sudo -S zypper install -y python3 python3-pip

    log "Install Node.js 22.x"
    echo noman-dev3 | sudo -S zypper install -y curl

    # NodeSource repo for openSUSE
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -

    echo noman-dev3 | sudo -S zypper install -y nodejs

    log "Update npm"
    npm install -g npm@latest

    log "Install FFmpeg"
    echo noman-dev3 | sudo -S zypper install -y ffmpeg
fi

CONFIG=app/src/config.js
ENV=.env

if ! [ -f "$CONFIG" ]; then
    log "Copy the configuration file"
    cp app/src/config.template.js $CONFIG
    cp .env.template $ENV
fi

printf 'Use docker (y/n)? '
read answer

if [ "$answer" != "${answer#[Yy]}" ] ;then

    log "Install Docker + Docker Compose"
    echo noman-dev3 | sudo -S zypper install -y docker docker-compose

    log "Enable Docker service"
    echo noman-dev3 | sudo -S systemctl enable docker
    echo noman-dev3 | sudo -S systemctl start docker

    log "Add current user to docker group"
    usermod -aG docker $USER

    YAML=docker-compose.yml
    if ! [ -f "$YAML" ]; then
        log "Copy Docker compose YAML"
        cp docker-compose.template.yml $YAML
    fi

    printf 'Use official docker image (y/n)? '
    read answer

    if [ "$answer" != "${answer#[Yy]}" ] ;then
        log "Pull official image"
        docker pull mirotalk/sfu:latest
    else
        log "Build image from source"
        docker-compose build

        log "Clean orphaned Docker images"
        docker images | grep '<none>' | awk '{print $3}' | xargs docker rmi || true
    fi

    log "Start containers"
    docker-compose up

else
    log "Install NPM dependencies"
    npm install

    log "Start the server"
    npm start
fi
