#!/usr/bin/env bash

NAME=$(git remote get-url origin | sed 's|.*git.*.com[/:]\(.*\).git|\1|' | awk '{print tolower($0)}')
BRANCH_LOCAL=$(git branch | grep -F "*" | grep -v HEAD | cut -d ' ' -f2)
BRANCH_CI="$CI_COMMIT_REF_NAME"
BRANCH=${BRANCH_LOCAL:-$BRANCH_CI}

DOCKER_REGISTRY_PREFIX=registry.gitlab.webbylab.com

PROJECT=${PROJECT:-$DOCKER_REGISTRY_PREFIX/$NAME}
TAG=${TAG:-$BRANCH}
DOCKER_TAR_DIR="builds"

if [[ -z $TAG ]]; then
    echo "Cannot get branch name, you must pass TAG instead"
    exit 1
fi

help() {
    cat <<HELP

    Simplify docker tasks

    Usage: ./docker-util COMMAND [FLAGS]

    Commands:
        build [-c|--cache] [-t|--target=name[:tag]]   create image from Dockerfile
        rundaemon                                     run docker daemon in backgrond
        push                                          create tag and push docker image into registry
        lint                                          load container and run the lint tests on it
        test_functional                               load container and run the functional tests on it
        test_unit                                     load container and run the unit tests on it

    Flags:
        -c|--cache                                    use docker cache during image building
        -t|--target=name[:tag]                        name and optionally a tag in the 'name:tag' format

HELP
}

login() {
    if [ -z "$CI_JOB_TOKEN" ]; then
        echo "You are not allowed to push to the Docker registry" ; exit 126
    fi
    docker login -u gitlab-ci-token -p "$CI_JOB_TOKEN" "$CI_REGISTRY"
}

get_image_path() {
    local tar_name
    tar_name=$(echo "$1" | sed s:/:__:g)

    echo "$DOCKER_TAR_DIR/$tar_name.tar"
}

load_image_from_tar() {
    local img_path
    img_path=$(get_image_path "$1")

    echo "loading container from $img_path"
    docker load -i "$img_path"
}

rundaemon() {
    echo "Running docker daemon..."
    dockerd &> /dev/null &
}

run() {
    build
    dev
}

build() {
    echo "build container $PROJECT:${TAG}"
    rm -rf data/db
    local flags

    if [[ $1 != 'use_cache' ]]; then
        flags='--no-cache'
    fi

    DATA_DIR=${DATA_DIR:-} docker build $flags --rm -t "$PROJECT:${TAG}" .

    if [ -n "$CI_JOB_TOKEN" ]; then
        local img_path
        local prod_img_path
        local prod_image

        img_path=$(get_image_path "$PROJECT:${TAG}")
        echo "save image $PROJECT:${TAG} to $img_path"

        docker save -o "$img_path" "$PROJECT:${TAG}"

        prod_image=$(get_production_image)
        docker tag "$prod_image" "$PROJECT:${TAG}_production"

        prod_img_path=$(get_image_path "$PROJECT:${TAG}_production")

        echo "save image $PROJECT:${TAG}_production to $prod_img_path"
        docker save -o "$prod_img_path" "$PROJECT:${TAG}_production"
    fi
}

get_production_image() {
    local prod_image
    local test_layers_count

    local docker_layer_statements="RUN|CMD|MAINTAINER|ENV|EXPOSE|ADD|COPY|ENTRYPOINT|WORKDIR"
    test_layers_count=$(awk "BEGIN {total = 0} {if (/FROM production AS test/ || (/$docker_layer_statements/ && total > 0)) {total++} } END {print total}" Dockerfile)

    prod_image=$(docker history "$PROJECT:${TAG}" -q | awk "NR==$test_layers_count")

    echo "$prod_image"
}

push() {
    if [ -n "$CI_JOB_TOKEN" ]; then
        load_image_from_tar "$PROJECT:${TAG}_production"
    fi

    login

    docker tag "$PROJECT:${TAG}_production" "$PROJECT:latest"

    echo "push image $PROJECT:latest"
    docker push "$PROJECT:latest"
}

lint() {
    if [ -n "$CI_JOB_TOKEN" ]; then
        load_image_from_tar "$PROJECT:$TAG"
    fi

    echo "run lint"
    TAG=${TAG} docker-compose \
        -f docker-compose.yml \
        -f docker-compose.test.yml \
        run backend bash -c 'npm run test:lint'
}

test_unit() {
    if [ -n "$CI_JOB_TOKEN" ]; then
        load_image_from_tar "$PROJECT:$TAG"
    fi

    TAG=${TAG} docker-compose \
        -f docker-compose.yml \
        -f docker-compose.test.yml \
        down --remove-orphans

    echo "run unit tests"
    TAG=${TAG} docker-compose \
        -f docker-compose.yml \
        -f docker-compose.test.yml \
        run backend bash -c 'npm run migration:undo:all && npm run migration && npm run test:unit'
}

test_functional() {
    if [ -n "$CI_JOB_TOKEN" ]; then
        load_image_from_tar "$PROJECT:$TAG"
    fi

    TAG=${TAG} docker-compose \
        -f docker-compose.yml \
        -f docker-compose.test.yml \
        down --remove-orphans

    echo "run functional tests"
    TAG=${TAG} docker-compose \
        -f docker-compose.yml \
        -f docker-compose.test.yml \
        run backend bash -c 'npm run migration:undo:all && npm run migration && npm run test:functional'
}

ARGS=()
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--cache)
            ARGS=( "${ARGS[@]:-}" "use_cache" )
            shift
            ;;
        -t=*|--target=*)
            IFS='=' read -ra val <<< "$1"
            IFS=':' read -ra target <<< "${val[1]}"

            [[ -n ${target[0]} ]] && PROJECT=${target[0]}
            [[ -n ${target[1]} ]] && TAG=${target[1]}

            shift 1
            ;;
        run|build|push|rundaemon|lint|test_unit|test_functional|login)
            COMMAND=$1
            shift
            ;;
        -h|--help)
            help
            exit 0
            ;;
        *)
            printf "\e[31mcommand '%s' is not supported\e[0m\n" "$1"
            help
            exit 1
            ;;
    esac
done

printf -v args "%s" "${ARGS[@]}"

"$COMMAND" "$args"
