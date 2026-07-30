Библиотека являет собой Bash файл / CLI, который автоматизирует и стандартизирует рутинные задачи при работе с Docker.
Библиотека используются в двух окружениях: GitLab CI runner + Docker executor, OS + Bash.

Список опций, которые предоставляет CLI:
*  **build**. Создание образа проекта. **Использует Dockerfile, который должен находится на одном уровне с Bash файлом.**

В результате создасться проект, имя которого соответствует следующему шаблону `{ИМЯ_РЕЕСТРА}{ИМЯ РЕПОЗИТОРИЯ}:{ИМЯ_ВЕТКИ}.`

Пример: `registry.gitlab.webbylab.com/smarthome/combined-ci-image:demo_SMART-77`

*  **push**. Пуш образа проекта в соответствующий ему GitLab registry

Пуш происходит только если запуск утилиты произошел в окружении GitLab CI


Для использования утилит в окружении Gitlab CI runner необходимо выполнить следующие шаги в `.gitlab-ci.yml`:

* Использовать образ `registry.gitlab.webbylab.com/smarthome/combined-ci-image:latest`, который содержит в себе все необходимые сервисы. Добавить в services `docker:dind` для использования Docker внутри Docker(Docker inside Docker executor)
* Склонить репозиторий с библиотекой `https://gitlab.webbylab.com/SmartHome/docker-utils`. Удобнее всего клонить репозиторий внутри CI при помощи https + access token - альтернатива ssh + ssh-keys
* Access token устанавливается через GUI GitLab. Нужно попросить Owner или Maintainer проекта об этом
* После клонирования репозитория перенести необходимые файлы(файл) на один уровень с `Dockerfile`. Как правило это корневая папка проекта. Это упростит конфигурацию флоу CI

Например:
```
mv ./docker-utils/utils.sh docker.sh
```

* Использовать библиотеку по назначению.

Например:
```
./docker.sh build
```

Пример полного `.gitlab-ci.yml` файла, который использует библиотеку:
```
image: registry.gitlab.webbylab.com/smarthome/combined-ci-image:latest

services:
  - docker:dind

stages:
  - build

current project:
  stage: build
  script:
    - git clone https://oauth2:$ACCESS_TOKEN@gitlab.webbylab.com/SmartHome/docker-utils.git
    - mv ./docker-utils/utils.sh docker.sh
    - ./docker.sh build
```


Для использования утилит в окружении произвольной OS нужно убедиться в следующем:
*  на машине установлен git. Он понадобится для обновления библиотеки
*  на машине установлен и настроен Docker. Он понадобится для создания образов
*  машина поддерживает исполнение Bash-скриптов
*  положить скрипт на один уровень с Dockerfile. запустить скрипт `./docker.sh build`



