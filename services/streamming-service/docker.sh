#!/bin/bash

NAME=$(git config --get remote.origin.url | sed 's:^.*/::' | sed 's:.git::')
BRANCH_LOCAL=$(git branch | grep \* | grep -v HEAD | cut -d ' ' -f2)
BRANCH_CI=$CI_COMMIT_REF_NAME
BRANCH=${BRANCH_LOCAL:-$BRANCH_CI}
DUID=$(id -u)

if [ -z "$BRANCH" ]
then
      echo "Can't find branch name"
      exit 1;
fi

if [ -z "$DOCKER_REGISTRY_PREFIX" ]; then
  DOCKER_REGISTRY_PREFIX=registry.gitlab.webbylab.com/$(git config --get remote.origin.url | sed 's:.*gitlab\.webbylab\.com.::' | sed 's:/[^/]*$::' | awk '{print tolower($0)}')
fi

PROJECT=${2:-$DOCKER_REGISTRY_PREFIX/$NAME}
TAG=${3:-$BRANCH}

error_handler() {
	error_message=$1

	if [ -z "$error_message" ]; then
		error_message="Unknown error..."
	fi

	echo ""
	echo "### ERROR: $error_message"
	echo ""

	exit 1
}

rundaemon() {
    dockerd &> /dev/null &
}

main() {
    case $1 in
        "buildx")
            init_buildx
            buildx
            ;;
        "release_buildx")
            init_buildx
            release_buildx
            ;;
        "login")
            login
            ;;
        "build")
            build
            ;;
        "push")
            push
            ;;
        "push_bridge_type_to_demo")
            push_bridge_type_to_demo
            ;;
        "release_bridge_type")
            release_bridge_type
            ;;
        "push_to_market")
            push_to_market
            ;;
        "rundaemon")
            rundaemon
            ;;
        *)
            exit 1
            ;;
    esac
}

init_buildx() {
    mkdir -p ~/.docker/cli-plugins
    mv buildx ~/.docker/cli-plugins/docker-buildx
    docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
    docker context create regestry
    docker buildx create regestry --use --name mybuilder
}

release_buildx() {
    if [ -z "$SOURCE_IMAGE" ]; then
        ## set project name as default SOURCE_IMAGE
        SOURCE_IMAGE=$NAME
    fi
    
    IMAGE=$SOURCE_REGISTRY/$SOURCE_IMAGE

    echo "docker buildx imagetools create -t $IMAGE:$TARGET_TAG $IMAGE:$SOURCE_TAG"

    docker buildx imagetools create -t $IMAGE:$TARGET_TAG "$IMAGE:$SOURCE_TAG"
}

buildx() {
    if [ -z "$SOURCE_IMAGE" ]; then
        ## set project name as default SOURCE_IMAGE
        SOURCE_IMAGE=$NAME
    fi

    if [ -z "$SOURCE_TAG" ]; then
        ## set default SOURCE_TAG as latest
        SOURCE_TAG=latest
    fi

    if [ -z "$SOURCE_REGISTRY" ]; then
        SOURCE_REGISTRY=$DOCKER_REGISTRY_PREFIX
    fi

    echo "docker buildx build --platform=$IMAGE_PLATFORMS -t $SOURCE_REGISTRY/$SOURCE_IMAGE:$SOURCE_TAG . --no-cache --push"

    docker buildx build --platform=$IMAGE_PLATFORMS -t $SOURCE_REGISTRY/$SOURCE_IMAGE:$SOURCE_TAG . --no-cache --push
}

login() {
    if [ -z "$DOCKER_LOGIN" ]; then
        DOCKER_LOGIN=gitlab-ci-token
    fi

    if [ -z "$DOCKER_PASSWORD" ]; then
        DOCKER_PASSWORD=$CI_JOB_TOKEN
    fi

    if [ -z "$SOURCE_REGISTRY" ]; then
        SOURCE_REGISTRY=$CI_REGISTRY
    fi

    echo "docker login -u $DOCKER_LOGIN -p <DOCKER_PASSWORD> $SOURCE_REGISTRY"

    docker login -u $DOCKER_LOGIN -p "$DOCKER_PASSWORD" "$SOURCE_REGISTRY"
}

build() {
    echo "NAME - $NAME"
    echo "DOCKER_REGISTRY_PREFIX - $DOCKER_REGISTRY_PREFIX"
    echo "PROJECT - $PROJECT"
    echo "docker build --no-cache --rm -t $PROJECT:${TAG} ."

    docker build --no-cache --rm -t $PROJECT:${TAG} .
    exit $?
}

push() {
    if [ -z "$CI_JOB_TOKEN" ]
    then
        echo 'You are not allowed to push to the Docker registry'
    else
        docker login -u gitlab-ci-token -p $CI_JOB_TOKEN $CI_REGISTRY
        docker tag $PROJECT:${TAG} $PROJECT:latest
        docker push $PROJECT:${TAG}
        docker push $PROJECT:latest
    fi
}

publish_bridge_type_configuration() {
    local SERVER_USER=$1
    local SERVER_HOST=$2
    local SERVER_KEY=$3
    local DATE=$4
    local VERSION=$5

    local BRIDGE_TYPE=$(cat 2smart.configuration.json | jq -r '.type')

    if [ $(cat 2smart.configuration.json | jq '.icon') != "null" ] ;
    then
        local ICON_FILE_PATH=$(cat 2smart.configuration.json | jq -r '.icon')
        if [ $ICON_FILE_PATH != ${ICON_FILE_PATH##$(pwd)/} ]; then
            echo "Wrong icon path";
            exit 1;
        fi
        local ICON_FILENAME=$(basename $ICON_FILE_PATH)
        local ICON_EXT=${ICON_FILE_PATH##*.}
        if [ ! -f $ICON_FILE_PATH ]; then
            echo "Cannot find icon path $ICON_FILE_PATH"
            exit 1
        fi
        
        local ICON_NEW_PATH=\"favicon.$ICON_EXT\"
    else
        local ICON_NEW_PATH=
    fi

    eval `ssh-agent -s`
    mkdir -p ~/.ssh

    echo "$SERVER_KEY" | tr -d '\r' > ~/.ssh/id_rsa
    chmod 700 ~/.ssh/id_rsa

    ssh-add ~/.ssh/id_rsa
    ssh-keygen -y -f ~/.ssh/id_rsa > ~/.ssh/id_rsa.pub
    ssh-keyscan -H $SERVER_HOST >> ~/.ssh/known_hosts

    local SERVER_PATH=$(ssh $SERVER_USER@$SERVER_HOST docker exec -i 2smart-core bash -c "'echo \$HOST_MAIN_PATH'")

    ssh $SERVER_USER@$SERVER_HOST mkdir -p $SERVER_PATH/system/releases/bridge_types || error_handler "Error while creating folder on server"
    ssh $SERVER_USER@$SERVER_HOST mkdir -p $SERVER_PATH/system/releases/bridge_types/$BRIDGE_TYPE || error_handler "Error while creating folder on server"

    rm -rf tmp
    mkdir tmp

    cat 2smart.configuration.json | jq -r ".released_at = \"$DATE\"" | jq -r ".version = \"$VERSION\"" | jq -r ".icon = ${ICON_NEW_PATH:-null}" > tmp/2smart.configuration.json
    cat tmp/2smart.configuration.json

    if [ ! -z "$ICON_FILE_PATH" ] ;
    then
        scp $ICON_FILE_PATH $SERVER_USER@$SERVER_HOST:$SERVER_PATH/system/releases/bridge_types/$BRIDGE_TYPE/favicon.$ICON_EXT || error_handler "Error while copying file to server"
    fi

    scp tmp/2smart.configuration.json $SERVER_USER@$SERVER_HOST:$SERVER_PATH/system/releases/bridge_types/$BRIDGE_TYPE/2smart.configuration.json || error_handler "Error while copying file to server"
    rm -rf tmp
}

push_with_tag() {
    local PUSH_TAG=$1
    if [ -z "$CI_JOB_TOKEN" ]
    then
        echo 'You are not allowed to push to the Docker registry'
    else
        docker login -u gitlab-ci-token -p $CI_JOB_TOKEN $CI_REGISTRY
        docker tag $PROJECT:${TAG} $PROJECT:${PUSH_TAG}
        docker push $PROJECT:${PUSH_TAG}
    fi
}

release_bridge_image() {
    local PUSH_TAG=$1
    if [ -z "$CI_JOB_TOKEN" ]
    then
        echo 'You are not allowed to push to the Docker registry'
    else
        docker login -u gitlab-ci-token -p $CI_JOB_TOKEN $CI_REGISTRY
        docker pull $PROJECT:latest
        docker tag $PROJECT:latest $PROJECT:${PUSH_TAG}
        docker push $PROJECT:${PUSH_TAG}
    fi
}

push_bridge_type_to_demo() {
    local DATE=$(date -u +'%Y-%m-%d %H:%M:%S')
    local VERSION=demo-v$(echo $DATE | sed 's/[^0-9]*//g')

    push_with_tag $VERSION
    publish_bridge_type_configuration "$DEMO_USER" "$DEMO_HOST" "$DEMO_KEY" "$DATE" "$VERSION"
}

release_bridge_type() {
    local DATE=$(date -u +'%Y-%m-%d %H:%M:%S')
    local VERSION=release-v$(echo $DATE | sed 's/[^0-9]*//g')

    release_bridge_image $VERSION || error_handler "Failed to release bridge image..."
    publish_bridge_type_configuration "$PROD_USER" "$PROD_HOST" "$PROD_KEY" "$DATE" "$VERSION" || error_handler "Failed upload bridge configuration..."
}

push_to_market() {
    echo "Deprecated!"
}

main $1
